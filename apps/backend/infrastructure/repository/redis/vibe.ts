import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import {
  type ConnectionId,
  type MemberId,
  type RoomId,
  type Vibe,
  VibeStatus,
} from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import { aggregate, type VibeRepository } from "../../../domain/vibe";

/**
 * `VibeRepository` の Redis 実装、メンバー 1 人あたりの状態を `vibe:{roomId}:member:{memberId}` Hash に `connectionId → VibeStatus` で保持し、ルームに属するメンバー集合を `vibe:{roomId}:members` Set で別管理する
 * メンバー単位の集約は毎回 `HVALS` で取得して `aggregate` を通すことでキャッシュ無しの一貫性を保ち、in-memory 実装と同じセマンティクスを再現する
 * `save` と `delete` は MULTI/EXEC で原子化し、`isFirst` `isLast` を Hash サイズ変化から確定させる
 */
@Injectable()
export class RedisVibeRepository implements VibeRepository, OnModuleDestroy {
  private readonly client: Redis;

  private readonly logger = new Logger(RedisVibeRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  async save(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ isFirst: boolean; aggregated: VibeStatus }> {
    const memberKey = this.memberKey(roomId, memberId);
    const membersKey = this.membersKey(roomId);
    const results = await this.client
      .multi()
      .hset(memberKey, connectionId, JSON.stringify(status))
      .hlen(memberKey)
      .hvals(memberKey)
      .sadd(membersKey, memberId)
      .exec();
    const sizeAfter = this.coerceNumber(results, 1);
    const rawValues = this.coerceArray(results, 2);
    const aggregated = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
    return { isFirst: sizeAfter === 1, aggregated };
  }

  async update(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ updated: boolean; aggregated: VibeStatus | null }> {
    const memberKey = this.memberKey(roomId, memberId);
    const exists = await this.client.hexists(memberKey, connectionId);
    if (exists === 0) {
      return { updated: false, aggregated: null };
    }
    const results = await this.client
      .multi()
      .hset(memberKey, connectionId, JSON.stringify(status))
      .hvals(memberKey)
      .exec();
    const rawValues = this.coerceArray(results, 1);
    const aggregated = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
    return { updated: true, aggregated };
  }

  async delete(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ): Promise<{ isLast: boolean; aggregated: VibeStatus | null }> {
    const memberKey = this.memberKey(roomId, memberId);
    const membersKey = this.membersKey(roomId);
    const results = await this.client
      .multi()
      .hdel(memberKey, connectionId)
      .hlen(memberKey)
      .hvals(memberKey)
      .exec();
    const sizeAfter = this.coerceNumber(results, 1);
    if (sizeAfter === 0) {
      await this.client.multi().srem(membersKey, memberId).del(memberKey).exec();
      return { isLast: true, aggregated: null };
    }
    const rawValues = this.coerceArray(results, 2);
    const aggregated = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
    return { isLast: false, aggregated };
  }

  async snapshot(roomId: RoomId): Promise<Vibe[]> {
    const memberIds = await this.client.smembers(this.membersKey(roomId));
    if (memberIds.length === 0) {
      return [];
    }
    const pipeline = this.client.pipeline();
    for (const memberId of memberIds) {
      pipeline.hvals(this.memberKey(roomId, memberId as MemberId));
    }
    const results = (await pipeline.exec()) ?? [];
    const snapshot: Vibe[] = [];
    for (let index = 0; index < memberIds.length; index += 1) {
      const memberId = memberIds[index] as MemberId;
      const rawValues = this.coerceArray(results, index);
      if (rawValues.length === 0) {
        continue;
      }
      const status = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
      snapshot.push({ memberId, status });
    }
    return snapshot;
  }

  async get(roomId: RoomId, memberId: MemberId): Promise<VibeStatus | null> {
    const rawValues = await this.client.hvals(this.memberKey(roomId, memberId));
    if (rawValues.length === 0) {
      return null;
    }
    return aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
  }

  async remove(roomId: RoomId): Promise<void> {
    const membersKey = this.membersKey(roomId);
    const memberIds = await this.client.smembers(membersKey);
    const pipeline = this.client.pipeline();
    for (const memberId of memberIds) {
      pipeline.del(this.memberKey(roomId, memberId as MemberId));
    }
    pipeline.del(membersKey);
    await pipeline.exec();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  private memberKey(roomId: RoomId, memberId: MemberId): string {
    return `vibe:${roomId}:member:${memberId}`;
  }

  private membersKey(roomId: RoomId): string {
    return `vibe:${roomId}:members`;
  }

  /**
   * MULTI/EXEC や pipeline の `[error, value][]` 結果から指定インデックスの数値を取り出す
   * Redis 側のエラーは throw に変換し、後続の Zod パースが意味不明な値で落ちないようにする
   */
  private coerceNumber(results: [Error | null, unknown][] | null, index: number): number {
    const entry = results?.[index];
    if (!entry) {
      throw new Error(`redis MULTI returned no result at index ${index}`);
    }
    const [error, value] = entry;
    if (error) {
      throw error;
    }
    return Number(value);
  }

  /**
   * MULTI/EXEC や pipeline の `[error, value][]` 結果から指定インデックスの string 配列を取り出す
   * `HVALS` の戻り値型に合わせ、Redis エラーは throw に変換する
   */
  private coerceArray(results: [Error | null, unknown][] | null, index: number): string[] {
    const entry = results?.[index];
    if (!entry) {
      throw new Error(`redis MULTI returned no result at index ${index}`);
    }
    const [error, value] = entry;
    if (error) {
      throw error;
    }
    return value as string[];
  }
}
