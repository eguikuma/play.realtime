import { Global, Module } from "@nestjs/common";
import { HallwayConnectionCounter } from "../../application/hallway/connection-counter";
import { Environment } from "../../environment";
import { InMemoryHallwayConnectionCounter } from "./in-memory/hallway-connection-counter";
import { RedisHallwayConnectionCounter } from "./redis/hallway-connection-counter";

/**
 * 接続数カウンタ系 port に driver 別実装を紐付ける Global モジュール
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、Gateway 等の各注入箇所には実装の違いを意識させない
 * Redis 実装は `HINCRBY` 戻り値で初回 / 最終を判定する前提で、複数 backend 構成でも同一メンバーの接続が 1 つのカウンタにまとまる
 */
@Global()
@Module({
  providers: [
    {
      provide: HallwayConnectionCounter,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisHallwayConnectionCounter(environment.REDIS_URL as string);
        }

        return new InMemoryHallwayConnectionCounter();
      },
      inject: [Environment],
    },
  ],
  exports: [HallwayConnectionCounter],
})
export class CounterModule {}
