import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { BgmState, type RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { BgmRepository } from "../../../domain/bgm";

/**
 * `BgmRepository` の Redis 実装、ルーム 1 件あたり現在状態を `bgm:{roomId}` String キーに JSON で保存する
 * 1 ルーム 1 状態のため Hash の field 分解は不要、`SET` と `GET` で上書き保存だけを扱う
 */
@Injectable()
export class RedisBgmRepository implements BgmRepository, OnModuleDestroy {
  private readonly client: Redis;

  private readonly logger = new Logger(RedisBgmRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  async get(roomId: RoomId): Promise<BgmState | null> {
    const raw = await this.client.get(this.key(roomId));
    if (raw === null) {
      return null;
    }
    return BgmState.parse(JSON.parse(raw));
  }

  async save(roomId: RoomId, state: BgmState): Promise<void> {
    await this.client.set(this.key(roomId), JSON.stringify(state));
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
    return `bgm:${roomId}`;
  }
}
