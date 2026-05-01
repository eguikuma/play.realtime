import { Global, Module } from "@nestjs/common";
import { PubSub } from "../../application/ports/pubsub";
import { Environment } from "../../environment";
import { InMemoryPubSub } from "./in-memory";
import { RedisPubSub } from "./redis";

/**
 * `PubSub` トークンに driver 別実装を紐付ける Global モジュール
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、usecase 側のコードは触らない
 * `redis` の場合は検証済み環境の `REDIS_URL` を constructor 注入する (`STORAGE_DRIVER=redis` のときの必須は `Environment` 側の `superRefine` で保証済み)
 */
@Global()
@Module({
  providers: [
    {
      provide: PubSub,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisPubSub(environment.REDIS_URL as string);
        }
        return new InMemoryPubSub();
      },
      inject: [Environment],
    },
  ],
  exports: [PubSub],
})
export class PubSubModule {}
