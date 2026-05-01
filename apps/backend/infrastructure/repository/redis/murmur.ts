import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Murmur, type RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { MurmurRepository } from "../../../domain/murmur";

/**
 * `MurmurRepository` の Redis 実装、ルーム単位の List に投稿を JSON でプッシュする
 * `RPUSH` で末尾に追加し `LRANGE -limit -1` で末尾から `limit` 件を切り出すことで、in-memory 実装と同じ「古い順で最新 N 件」を返す
 */
@Injectable()
export class RedisMurmurRepository implements MurmurRepository, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisMurmurRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  async save(murmur: Murmur): Promise<void> {
    await this.client.rpush(this.key(murmur.roomId), JSON.stringify(murmur));
  }

  async latest(roomId: RoomId, limit: number): Promise<Murmur[]> {
    if (limit <= 0) {
      return [];
    }

    const raws = await this.client.lrange(this.key(roomId), -limit, -1);
    return raws.map((raw) => Murmur.parse(JSON.parse(raw)));
  }

  async remove(roomId: RoomId): Promise<void> {
    await this.client.del(this.key(roomId));
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  private key(roomId: RoomId): string {
    return `murmur:${roomId}`;
  }
}
