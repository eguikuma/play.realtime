import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { HallwayInvitationTimers } from "../../../application/hallway/invitation-timers";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * SETNX 短期ロックの TTL
 * `handleExpired` の実処理時間を十分上回り、かつ次回 register の TTL と重ならない値で固定する
 */
const DONE_LOCK_MS = 5000;

const PREFIX = "hallway:invtimer:";
const DONE_PREFIX = "hallway:invtimerdone:";

const keyOf = (id: InvitationId) => `${PREFIX}${id}`;
const doneKeyOf = (key: string) => `${DONE_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `HallwayInvitationTimers` port の Redis 実装
 * 招待 ID ごとの失効タイマーを Redis TTL key で複数 backend に共有し、TTL 切れの expired notification を受けた instance のうち SETNX done lock を取れた 1 instance だけが callback を呼ぶ
 * `delayMs` は呼出側 (`InviteHallway` の 10 秒など) から受け取った値をそのまま `SET PX` の TTL に渡し、in-memory 実装と同じ「呼出時に決まる遅延」を維持する
 * 別 backend でも招待 ID で同じ key 空間に揃うため、`Accept` / `Decline` / `Cancel` / 接続切断のどこから cancel されても 1 回の `DEL` で他 instance の expired を抑止できる
 */
@Injectable()
export class RedisHallwayInvitationTimers implements HallwayInvitationTimers, OnModuleDestroy {
  private readonly client: Redis;
  private readonly callbacks = new Map<string, () => void>();
  private readonly logger = new Logger(RedisHallwayInvitationTimers.name);

  constructor(redisUrl: string, listener: RedisExpiredListener, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    listener.register(PREFIX, (key) => {
      void this.handleExpired(key);
    });
  }

  /**
   * 指定招待 ID の TTL key を `SET PX delayMs NX` で発行し、callback はローカル Map に持つ
   * Redis 障害時はログのみで他処理を止めず fire-and-forget で進める
   * Map には callback を残しておくため復帰後の同 ID 再 register で上書き解消する
   */
  register(id: InvitationId, delayMs: number, callback: () => void): void {
    const key = keyOf(id);
    this.callbacks.set(key, callback);
    this.client.set(key, "1", "PX", delayMs, "NX").catch((error: unknown) => {
      this.logger.error(
        `redis SET failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /**
   * ローカル Map から callback を消し、Redis 側の TTL key も `DEL` で打ち切る
   * 既発火または未登録の場合でも追加コストは `DEL` 1 発に収まり、in-memory 実装の no-op 仕様と semantics 互換にする
   */
  cancel(id: InvitationId): void {
    const key = keyOf(id);
    this.callbacks.delete(key);
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
   * SETNX done lock を取れた instance のうち、自分のローカル Map に callback を持つ instance だけが実際に callback を呼ぶ
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

    const callback = this.callbacks.get(key);
    if (!callback) {
      void this.client.del(doneKey).catch((error: unknown) => {
        this.logger.error(
          `redis DEL done lock fail-safe failed for key "${key}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return;
    }

    this.callbacks.delete(key);
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
