import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { RoomLifecycleGrace } from "../../../application/room/lifecycle-grace";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * SETNX 短期ロックの TTL
 * `handleExpired` の実処理時間を十分上回り、かつ次回 schedule の TTL と重ならない値で固定する
 */
const DONE_LOCK_MS = 5000;

const PREFIX = "room:grace:";
const DONE_PREFIX = "room:gracedone:";

const keyOf = (roomId: RoomId) => `${PREFIX}${roomId}`;
const doneKeyOf = (key: string) => `${DONE_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `RoomLifecycleGrace` port の Redis 実装
 * ルーム閉鎖前の猶予タイマーを Redis TTL key で複数 backend に共有し、TTL 切れの expired notification を受けた instance のうち SETNX done lock を取れた 1 instance だけが fire (= `RoomLifecycle.destroy`) を呼ぶ
 * `override` で差し替える `graceMs` は Redis 側に持たず各 instance のローカル値とし、`schedule` 時の TTL に流すだけで十分にする
 * 別 backend が起動順で別の `graceMs` を保持しても、最初に schedule した instance の値で TTL が決まり in-memory 実装と等価な挙動が再現する
 */
@Injectable()
export class RedisRoomLifecycleGrace implements RoomLifecycleGrace, OnModuleDestroy {
  private readonly client: Redis;
  private readonly fires = new Map<string, () => Promise<void>>();
  private readonly logger = new Logger(RedisRoomLifecycleGrace.name);
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
   * 指定ルーム宛の TTL key を `SET PX graceMs` で発行し、fire callback はローカル Map に持つ
   * 同 key の既存 TTL があっても上書きで再起動できるよう NX を付けず、in-memory 実装の「再 schedule で前のタイマーを上書き」挙動と semantics 互換にする
   * Redis 障害時はログのみで他処理を止めず fire-and-forget で進める
   */
  schedule(roomId: RoomId, fire: () => Promise<void>): void {
    const key = keyOf(roomId);
    this.fires.set(key, fire);
    this.client.set(key, "1", "PX", this.graceMs).catch((error: unknown) => {
      this.logger.error(
        `redis SET failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /**
   * ローカル Map から fire を消し、Redis 側の TTL key も `DEL` で打ち切る
   * 既発火または未登録の場合でも追加コストは `DEL` 1 発に収まり、in-memory 実装の no-op 仕様と semantics 互換にする
   */
  cancel(roomId: RoomId): void {
    const key = keyOf(roomId);
    this.fires.delete(key);
    void this.client.del(key).catch((error: unknown) => {
      this.logger.error(
        `redis DEL failed for key "${key}"`,
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
   * SETNX done lock を取れた instance のうち、自分のローカル Map に fire を持つ instance だけが実際に fire する
   * Map 未保持で done lock を取ってしまった場合は done key を即 DEL し、別 instance が再取得できる余地を残す fail-safe を残す
   */
  private async handleExpired(key: string): Promise<void> {
    const doneKey = doneKeyOf(key);
    let acquired: "OK" | null;
    try {
      acquired = await this.client.set(doneKey, "1", "PX", DONE_LOCK_MS, "NX");
    } catch (error) {
      this.logger.error(
        `redis SETNX done lock failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return;
    }
    if (acquired !== "OK") {
      return;
    }

    const fire = this.fires.get(key);
    if (!fire) {
      void this.client.del(doneKey).catch((error: unknown) => {
        this.logger.error(
          `redis DEL done lock fail-safe failed for key "${key}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return;
    }

    this.fires.delete(key);
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
