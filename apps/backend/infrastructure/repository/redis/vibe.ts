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
 * `save` `update` `delete` は MULTI/EXEC を使わず素のコマンド列で分解する
 * `HSET` の戻り値と直後 `HVALS` の長さを併用して `isFirst` `isLast` を確定し、members set への `SADD` `SREM` は最後段で自己修復的に発火する
 */
@Injectable()
export class RedisVibeRepository implements VibeRepository, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisVibeRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  /**
   * `HSET` の新規/上書き戻り値と直後の `HVALS` 長を合わせて `isFirst` を確定し、members set への `SADD` は常時発火させて欠落自己修復の余地を残すことで MULTI/EXEC を撤廃する
   * 並列 save が同一メンバーで交錯しても `HSET` → `HVALS` がクライアント単位で順序保存されるため aggregate 入力の欠落は出ない、`SADD` の二重発火はコスト 1 cmd の無害な再投入に収まる
   */
  async save(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ isFirst: boolean; aggregated: VibeStatus }> {
    const memberKey = this.memberKey(roomId, memberId);
    const membersKey = this.membersKey(roomId);
    const created = await this.client.hset(memberKey, connectionId, JSON.stringify(status));
    const rawValues = await this.client.hvals(memberKey);
    await this.client.sadd(membersKey, memberId);

    const aggregated = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
    const isFirst = created === 1 && rawValues.length === 1;
    return { isFirst, aggregated };
  }

  /**
   * `HSET` 戻り値で「既存 field の更新」と「新規 field の作成」を見分け、剥がれた接続への update を補正 `HDEL` で打ち消すことで `HEXISTS` 単発ガードを撤廃する
   * 1 connection は 1 client に固定される仕様で同 `connectionId` への並列 update が発生しないため、`HSET` と補正 `HDEL` の間に他クライアントの `snapshot` が走る数 ms の窓は実害ゼロとみなす
   */
  async update(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ updated: boolean; aggregated: VibeStatus | null }> {
    const memberKey = this.memberKey(roomId, memberId);
    const created = await this.client.hset(memberKey, connectionId, JSON.stringify(status));
    if (created === 1) {
      await this.client.hdel(memberKey, connectionId);
      return { updated: false, aggregated: null };
    }

    const rawValues = await this.client.hvals(memberKey);
    const aggregated = aggregate(rawValues.map((raw) => VibeStatus.parse(JSON.parse(raw))));
    return { updated: true, aggregated };
  }

  /**
   * `HDEL` 後の `HVALS` 長を正として最後の接続を判定し、`isLast` のときだけ `SREM` で members set から取り除く、Redis hash は全 field 削除で自動消滅するため `DEL` は省く
   * 並列 delete が最後の 1 本を奪い合っても両者の `SREM` は idempotent で無害、members set の自己修復は次回 save の `SADD` に委ねる
   */
  async delete(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ): Promise<{ isLast: boolean; aggregated: VibeStatus | null }> {
    const memberKey = this.memberKey(roomId, memberId);
    const membersKey = this.membersKey(roomId);
    await this.client.hdel(memberKey, connectionId);
    const rawValues = await this.client.hvals(memberKey);

    if (rawValues.length === 0) {
      await this.client.srem(membersKey, memberId);
      return { isLast: true, aggregated: null };
    }

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
   * pipeline の `[error, value][]` 結果から指定インデックスの string 配列を取り出す
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
