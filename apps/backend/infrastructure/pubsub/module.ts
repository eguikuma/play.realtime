import { Global, Module } from "@nestjs/common";
import { PubSub } from "../../application/ports/pubsub";
import { InMemoryPubSub } from "./in-memory";

/**
 * `PubSub` トークンに in-memory 実装を紐付ける Global モジュール
 * 将来 Redis 実装を追加するときは `useClass` を差し替えるだけで usecase 側のコードは触らない
 */
@Global()
@Module({
  providers: [
    {
      provide: PubSub,
      useClass: InMemoryPubSub,
    },
  ],
  exports: [PubSub],
})
export class PubSubModule {}
