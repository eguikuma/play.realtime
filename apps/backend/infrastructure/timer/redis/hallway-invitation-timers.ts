import { randomUUID } from "node:crypto";
import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { HallwayInvitationTimers } from "../../../application/hallway/invitation-timers";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * オーナー印キーの TTL の上限見積
 * 招待 timer は呼出側から `delayMs` を渡されて TTL が決まるため、handleExpired 中にオーナー印が消えない上限値で十分長く取る
 * 実用ケースでの最長 delayMs (招待 10 秒) + 数秒バッファで 60 秒に固定する
 */
const OWNER_TTL_MS = 60_000;

const PREFIX = "hallway:expiry:";
const OWNER_PREFIX = "hallway:expiry:owner:";

const keyOf = (id: InvitationId) => `${PREFIX}${id}`;
const ownerKeyOf = (key: string) => `${OWNER_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `HallwayInvitationTimers` port の Redis 実装
 * 招待 ID ごとの失効タイマーを Redis TTL key で複数 backend に共有し、TTL 切れの expired notification を受けた各 instance がオーナー印を GET して自身の instanceId と一致した 1 instance だけが callback を呼ぶ
 * `delayMs` は呼出側 (`InviteHallway` の 10 秒など) から受け取った値をそのまま `SET PX` の TTL に渡し、in-memory 実装と同じ「呼出時に決まる遅延」を維持する
 * 別 backend でも招待 ID で同じ key 空間に揃うため、`Accept` / `Decline` / `Cancel` / 接続切断のどこから cancel されても 1 回の `DEL` で他 instance の expired を抑止できる
 */
@Injectable()
export class RedisHallwayInvitationTimers implements HallwayInvitationTimers, OnModuleDestroy {
  private readonly client: Redis;
  private readonly callbacks = new Map<string, () => void>();
  private readonly logger = new Logger(RedisHallwayInvitationTimers.name);
  private readonly instanceId = randomUUID();

  constructor(redisUrl: string, listener: RedisExpiredListener, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    listener.register(PREFIX, (key) => {
      void this.handleExpired(key);
    });
  }

  /**
   * 指定招待 ID の TTL key を `SET PX delayMs NX` で発行し、同時にオーナー印キーへ自身の instanceId を書く
   * callback はローカル Map に持ち、オーナー印と同期させる
   * Redis 障害時はログのみで他処理を止めず fire-and-forget で進める
   */
  register(id: InvitationId, delayMs: number, callback: () => void): void {
    const key = keyOf(id);
    const ownerKey = ownerKeyOf(key);
    this.callbacks.set(key, callback);
    this.client.set(key, "1", "PX", delayMs, "NX").catch((error: unknown) => {
      this.logger.error(
        `redis SET failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    this.client.set(ownerKey, this.instanceId, "PX", OWNER_TTL_MS).catch((error: unknown) => {
      this.logger.error(
        `redis SET owner failed for key "${ownerKey}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /**
   * ローカル Map から callback を消し、Redis 側の TTL key とオーナー印の両方を `DEL` で打ち切る
   * 既発火または未登録の場合でも追加コストは `DEL` 2 発に収まり、in-memory 実装の no-op 仕様と semantics 互換にする
   */
  cancel(id: InvitationId): void {
    const key = keyOf(id);
    const ownerKey = ownerKeyOf(key);
    this.callbacks.delete(key);
    void this.client.del(key).catch((error: unknown) => {
      this.logger.error(
        `redis DEL failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    void this.client.del(ownerKey).catch((error: unknown) => {
      this.logger.error(
        `redis DEL owner failed for key "${ownerKey}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /**
   * シャットダウンフックで Redis 接続を閉じ、未解放のままアプリを落とさないようにする
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  /**
   * expired notification 受信時の本体処理
   * オーナー印を GET して自身の instanceId と一致する 1 instance だけが callback を呼ぶ
   * オーナー印が取れない (= 既に消去済) または別 instance のものなら静かに skip し、SETNX 競合を一切起こさない
   * Map 不在で自身がオーナーの edge case は instance 再起動跨ぎ等のみで、オーナー印を DEL して終了する
   */
  private async handleExpired(key: string): Promise<void> {
    const ownerKey = ownerKeyOf(key);
    let owner: string | null;
    try {
      owner = await this.client.get(ownerKey);
    } catch (error) {
      this.logger.error(
        `redis GET owner failed for key "${ownerKey}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return;
    }
    if (owner !== this.instanceId) {
      return;
    }

    const callback = this.callbacks.get(key);
    if (!callback) {
      void this.client.del(ownerKey).catch((error: unknown) => {
        this.logger.error(
          `redis DEL owner stale failed for key "${ownerKey}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return;
    }

    this.callbacks.delete(key);
    void this.client.del(ownerKey).catch((error: unknown) => {
      this.logger.error(
        `redis DEL owner failed for key "${ownerKey}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    try {
      callback();
    } catch (error) {
      this.logger.error(
        `hallway invitation callback threw for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
