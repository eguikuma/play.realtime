import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { HallwayConnectionCounter } from "../../../application/hallway/connection-counter";

const PREFIX = "hallway:wsconns:";

const keyOf = (roomId: RoomId) => `${PREFIX}${roomId}`;

/**
 * `HallwayConnectionCounter` port の Redis 実装
 * `HINCRBY hallway:wsconns:{roomId} {memberId} ±1` の戻り値でメンバー単位の `isFirst` / `isLast` を判定し、複数 backend にまたがる接続を 1 つのカウンタに集約する
 * `detach` で 0 になった field は `HDEL` で即座に掃除し、in-memory 実装の `delete` 後に `next <= 0` で `isLast=true` を返す挙動と semantics 互換にする
 * 異常な double detach で戻り値が負になった場合は warn ログを残しつつ field を `HDEL` で完全削除して、整合を回復する
 */
@Injectable()
export class RedisHallwayConnectionCounter implements HallwayConnectionCounter, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisHallwayConnectionCounter.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  /**
   * `HINCRBY ... 1` の戻り値が 1 ならメンバー初の接続として `isFirst=true` を返す
   * cross-instance での同時 attach も Redis 側で原子的に直列化され、戻り値は呼出順で 1 / 2 / 3 ... と確定する
   */
  async attach(roomId: RoomId, memberId: MemberId): Promise<{ isFirst: boolean }> {
    const after = await this.client.hincrby(keyOf(roomId), memberId, 1);
    return { isFirst: after === 1 };
  }

  /**
   * `HINCRBY ... -1` の戻り値が 0 ならメンバー最後の接続切れとして `isLast=true` を返し、field を `HDEL` で掃除する
   * 戻り値が負なら異常な double detach で、warn ログを残しつつ field を完全削除して `isLast=true` を返し、整合を回復する
   * 戻り値が正なら接続が残っているので `isLast=false` を返す
   */
  async detach(roomId: RoomId, memberId: MemberId): Promise<{ isLast: boolean }> {
    const after = await this.client.hincrby(keyOf(roomId), memberId, -1);
    if (after <= 0) {
      if (after < 0) {
        this.logger.warn(
          `redis HINCRBY returned ${after} for room=${roomId} member=${memberId}, removing stale field`,
        );
      }
      await this.client.hdel(keyOf(roomId), memberId).catch((error: unknown) => {
        this.logger.error(
          `redis HDEL failed for room=${roomId} member=${memberId}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return { isLast: true };
    }

    return { isLast: false };
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
}
