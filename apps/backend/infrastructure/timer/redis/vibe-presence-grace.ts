import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { VibePresenceGrace } from "../../../application/vibe/presence-grace";
import type { RedisExpiredListener } from "./expired-listener";

/**
 * Vibe 退室通知の猶予期間、このミリ秒内に同じメンバーの再入室が来れば `Left` を送らずに済ませる
 */
const GRACE_MS = 1500;

/**
 * SETNX 短期ロックの TTL、`handleExpired` の実処理時間を十分上回り、かつ次回 schedule の TTL と重ならない値で固定する
 */
const DONE_LOCK_MS = 5000;

const PREFIX = "vibe:grace:";
const DONE_PREFIX = "vibe:gracedone:";

const keyOf = (roomId: RoomId, memberId: MemberId) => `${PREFIX}${roomId}:${memberId}`;
const doneKeyOf = (key: string) => `${DONE_PREFIX}${key.slice(PREFIX.length)}`;

/**
 * `VibePresenceGrace` port の Redis 実装
 * Redis TTL key + キースペース通知 + SETNX 短期ロックで複数 backend 間の二重配信を防ぐ
 * `schedule` で `SET PX 1500 NX` を打ち、TTL 切れの expired notification を受けた instance のうち SETNX done lock を取れた 1 instance だけが fire を担当する
 * fire は schedule した instance のローカル `Map` に保持するため、同 instance で expired を受けたときだけ実際に fire される
 * 別 instance に飛んだ場合は done key を即 DEL して譲る fail-safe で、Map 不一致による fire 抜けを最小化する
 */
@Injectable()
export class RedisVibePresenceGrace implements VibePresenceGrace, OnModuleDestroy {
  private readonly client: Redis;
  private readonly fires = new Map<string, () => void | Promise<void>>();
  private readonly logger = new Logger(RedisVibePresenceGrace.name);

  constructor(redisUrl: string, listener: RedisExpiredListener, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    listener.register(PREFIX, (key) => {
      void this.handleExpired(key);
    });
  }

  /**
   * 指定メンバー宛の TTL key を `SET PX 1500 NX` で発行し、fire callback はローカル Map に持つ
   * 同 key の既存 TTL があれば NX で書き込みを諦める
   * 既存 TTL の expired notification と Map 上書きで semantics は維持される
   * Redis 障害時はログのみで他処理を止めない fire-and-forget で進める、Map には fire を残しておくため復帰後の同 key 再 schedule で上書き解消する
   */
  schedule(roomId: RoomId, memberId: MemberId, fire: () => void | Promise<void>): void {
    const key = keyOf(roomId, memberId);
    this.fires.set(key, fire);
    this.client.set(key, "1", "PX", GRACE_MS, "NX").catch((error: unknown) => {
      this.logger.error(
        `redis SET failed for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /**
   * ローカル Map から fire を消し、Redis 側の TTL key も `DEL` で打ち切る
   * 戻り値は「この instance が fire を保持していたか」で、in-memory 実装の同期 boolean と semantics 互換にする
   * cross-instance の cancel は DEL が原子的に他 instance の expired を抑止するため、ゴースト fire は構造的に発生しない
   */
  cancel(roomId: RoomId, memberId: MemberId): boolean {
    const key = keyOf(roomId, memberId);
    const hadFire = this.fires.delete(key);
    void this.client.del(key).catch((error: unknown) => {
      this.logger.error(
        `redis DEL failed for key "${key}"`,
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
        `vibe grace fire threw for key "${key}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
