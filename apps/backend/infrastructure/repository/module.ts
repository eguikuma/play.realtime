import { Global, Module } from "@nestjs/common";
import { BgmRepository } from "../../domain/bgm";
import { HallwayRepository } from "../../domain/hallway";
import { MurmurRepository } from "../../domain/murmur";
import { RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { Environment } from "../../environment";
import { InMemoryBgmRepository } from "./in-memory/bgm";
import { InMemoryHallwayRepository } from "./in-memory/hallway";
import { InMemoryMurmurRepository } from "./in-memory/murmur";
import { InMemoryRoomRepository } from "./in-memory/room";
import { InMemoryVibeRepository } from "./in-memory/vibe";
import { RedisBgmRepository } from "./redis/bgm";
import { RedisHallwayRepository } from "./redis/hallway";
import { RedisMurmurRepository } from "./redis/murmur";
import { RedisRoomRepository } from "./redis/room";
import { RedisVibeRepository } from "./redis/vibe";

/**
 * 5 本の Repository トークンに driver 別実装を一括で紐付ける Global モジュール
 * 各 feature module は自分の Repository provider を持たず、ここでの `useFactory` 集約から `@Inject` で受け取る
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、usecase 側のコードは触らない
 * `redis` の場合は検証済み環境の `REDIS_URL` を constructor 注入する (`STORAGE_DRIVER=redis` のときの必須は `Environment` 側の `superRefine` で保証済み)
 */
@Global()
@Module({
  providers: [
    {
      provide: RoomRepository,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisRoomRepository(environment.REDIS_URL as string);
        }

        return new InMemoryRoomRepository();
      },
      inject: [Environment],
    },
    {
      provide: VibeRepository,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisVibeRepository(environment.REDIS_URL as string);
        }

        return new InMemoryVibeRepository();
      },
      inject: [Environment],
    },
    {
      provide: BgmRepository,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisBgmRepository(environment.REDIS_URL as string);
        }

        return new InMemoryBgmRepository();
      },
      inject: [Environment],
    },
    {
      provide: MurmurRepository,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisMurmurRepository(environment.REDIS_URL as string);
        }

        return new InMemoryMurmurRepository();
      },
      inject: [Environment],
    },
    {
      provide: HallwayRepository,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisHallwayRepository(environment.REDIS_URL as string);
        }

        return new InMemoryHallwayRepository();
      },
      inject: [Environment],
    },
  ],
  exports: [RoomRepository, VibeRepository, BgmRepository, MurmurRepository, HallwayRepository],
})
export class RepositoryModule {}
