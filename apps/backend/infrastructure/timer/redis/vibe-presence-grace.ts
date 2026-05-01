import { randomUUID } from "node:crypto";
import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { VibePresenceGrace } from "../../../application/vibe/presence-grace";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * Vibe 退室通知の猶予期間
 * このミリ秒内に同じメンバーの再入室が来れば `Left` を送らずに済ませる
 */
const GRACE_MS = 1500;

/**
 * オーナー印キーの TTL
 * `GRACE_MS` 経過後の expired notification 処理中にオーナー印が消えないよう余裕を持たせる
 * cancel または handleExpired 内で明示的に DEL するため、自然消滅は孤児キーの掃除目的
 */
const OWNER_TTL_MS = 6500;

const PREFIX = "vibe:grace:";
const OWNER_PREFIX = "vibe:grace:owner:";

const keyOf = (roomId: RoomId, memberId: MemberId) => `${PREFIX}${roomId}:${memberId}`;
const ownerKeyOf = (key: string) => `${OWNER_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `VibePresenceGrace` port の Redis 実装
 * Redis TTL key + キースペース通知 + オーナー印サイドキーで複数 backend 間の二重配信を防ぐ
 * `schedule` で TTL key とオーナー印を同時に書き、TTL 切れの expired notification を受けた各 instance がオーナー印を GET して自身の instanceId と一致した 1 instance だけが fire を担当する
 * fire は schedule した instance のローカル `Map` に保持するため、オーナー印と Map は必ず同 instance に揃う
 */
@Injectable()
export class RedisVibePresenceGrace implements VibePresenceGrace, OnModuleDestroy {
  private readonly client: Redis;
  private readonly fires = new Map<string, () => void | Promise<void>>();
  private readonly logger = new Logger(RedisVibePresenceGrace.name);
  private readonly instanceId = randomUUID();

  constructor(redisUrl: string, listener: RedisExpiredListener, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    listener.subscribe(PREFIX, (key) => {
      void this.handleExpired(key);
    });
  }

  /**
   * 指定メンバー宛の TTL key を `SET PX 1500 NX` で発行し、同時にオーナー印キーへ自身の instanceId を書く
   * fire callback はローカル Map に持ち、オーナー印と同期させる
   * TTL key は既存の expired notification を温存するため NX で衝突回避し、オーナー印は再 schedule で上書きするため NX を付けない
   * Redis 障害時はログのみで他処理を止めず fire-and-forget で進める
   */
  schedule(roomId: RoomId, memberId: MemberId, fire: () => void | Promise<void>): void {
    const key = keyOf(roomId, memberId);
    const ownerKey = ownerKeyOf(key);
    this.fires.set(key, fire);
    this.client.set(key, "1", "PX", GRACE_MS, "NX").catch((error: unknown) => {
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
   * ローカル Map から fire を消し、Redis 側の TTL key とオーナー印の両方を `DEL` で打ち切る
   * 戻り値は「この instance が fire を保持していたか」で in-memory 実装の同期 boolean と semantics 互換にする
   * cross-instance の cancel は TTL key DEL が原子的に他 instance の expired を抑止し、オーナー印 DEL が孤児キーを残さない
   */
  cancel(roomId: RoomId, memberId: MemberId): boolean {
    const key = keyOf(roomId, memberId);
    const ownerKey = ownerKeyOf(key);
    const hadFire = this.fires.delete(key);
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
    return hadFire;
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
   * オーナー印を GET して自身の instanceId と一致する 1 instance だけが fire を担当する
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

    const fire = this.fires.get(key);
    if (!fire) {
      void this.client.del(ownerKey).catch((error: unknown) => {
        this.logger.error(
          `redis DEL owner stale failed for key "${ownerKey}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return;
    }

    this.fires.delete(key);
    void this.client.del(ownerKey).catch((error: unknown) => {
      this.logger.error(
        `redis DEL owner failed for key "${ownerKey}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    try {
      await fire();
    } catch (error) {
      this.logger.error(
        `vibe grace fire threw for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
