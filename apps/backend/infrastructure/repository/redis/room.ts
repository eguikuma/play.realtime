import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Room, type RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { RoomRepository } from "../../../domain/room";

/**
 * `RoomRepository` の Redis 実装、ルーム 1 件を `room:{roomId}` String キーに JSON で保存する
 * `Room` は entity 全体置換だけが必要で field 単位の更新が無いため Hash ではなく String を選び、`SET` と `GET` だけで完結させる
 */
@Injectable()
export class RedisRoomRepository implements RoomRepository, OnModuleDestroy {
  private readonly client: Redis;

  private readonly logger = new Logger(RedisRoomRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  async save(room: Room): Promise<void> {
    await this.client.set(this.key(room.id), JSON.stringify(room));
  }

  async find(id: RoomId): Promise<Room | null> {
    const raw = await this.client.get(this.key(id));
    if (raw === null) {
      return null;
    }
    return Room.parse(JSON.parse(raw));
  }

  async remove(id: RoomId): Promise<void> {
    await this.client.del(this.key(id));
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

  private key(id: RoomId): string {
    return `room:${id}`;
  }
}
