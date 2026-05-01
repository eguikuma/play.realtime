import { randomUUID } from "node:crypto";
import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { RoomLifecycleGrace } from "../../../application/room/lifecycle-grace";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * オーナー印キーの TTL の上限見積
 * `graceMs` は本番 30 秒 + 数秒バッファで十分まかなえる
 * override で長くする可能性を考慮しても 5 分以内に収まる前提
 * handleExpired 中にオーナー印が消えないよう余裕を持たせるが、長過ぎると孤児キーが残るので 5 分に固定する
 */
const OWNER_TTL_MS = 300_000;

const PREFIX = "room:grace:";
const OWNER_PREFIX = "room:graceowner:";

const keyOf = (roomId: RoomId) => `${PREFIX}${roomId}`;
const ownerKeyOf = (key: string) => `${OWNER_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `RoomLifecycleGrace` port の Redis 実装
 * ルーム閉鎖前の猶予タイマーを Redis TTL key で複数 backend に共有し、TTL 切れの expired notification を受けた各 instance がオーナー印を GET して自身の instanceId と一致した 1 instance だけが fire (= `RoomLifecycle.destroy`) を呼ぶ
 * `override` で差し替える `graceMs` は Redis 側に持たず各 instance のローカル値とし、`schedule` 時の TTL に流すだけで十分にする
 * 別 backend が起動順で別の `graceMs` を保持しても、最後に schedule した instance の値で TTL とオーナー印が決まり in-memory 実装と等価な挙動が再現する
 */
@Injectable()
export class RedisRoomLifecycleGrace implements RoomLifecycleGrace, OnModuleDestroy {
  private readonly client: Redis;
  private readonly fires = new Map<string, () => Promise<void>>();
  private readonly logger = new Logger(RedisRoomLifecycleGrace.name);
  private readonly instanceId = randomUUID();
  private graceMs = 30_000;

  constructor(redisUrl: string, listener: RedisExpiredListener, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    listener.register(PREFIX, (key) => {
      void this.handleExpired(key);
    });
  }

  override(ms: number): void {
    this.graceMs = ms;
  }

  /**
   * 指定ルーム宛の TTL key を `SET PX graceMs` で発行し、同時にオーナー印キーへ自身の instanceId を書く
   * fire callback はローカル Map に持ち、オーナー印と同期させる
   * 同 key の既存 TTL があっても上書きで再起動できるよう NX を付けず、in-memory 実装の「再 schedule で前のタイマーを上書き」挙動と semantics 互換にする
   * Redis 障害時はログのみで他処理を止めず fire-and-forget で進める
   */
  schedule(roomId: RoomId, fire: () => Promise<void>): void {
    const key = keyOf(roomId);
    const ownerKey = ownerKeyOf(key);
    this.fires.set(key, fire);
    this.client.set(key, "1", "PX", this.graceMs).catch((error: unknown) => {
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
   * 既発火または未登録の場合でも追加コストは `DEL` 2 発に収まり、in-memory 実装の no-op 仕様と semantics 互換にする
   */
  cancel(roomId: RoomId): void {
    const key = keyOf(roomId);
    const ownerKey = ownerKeyOf(key);
    this.fires.delete(key);
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
        `room lifecycle fire threw for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
