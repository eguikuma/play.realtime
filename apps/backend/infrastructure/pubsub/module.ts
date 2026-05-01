import { Global, Module } from "@nestjs/common";
import { PubSub } from "../../application/ports/pubsub";
import { InMemoryPubSub } from "./in-memory";

/**
 * パブリッシュ購読ポートの仮置き実装を全機能で共有する グローバルな NestJS モジュール
 * useClass によって `InMemoryPubSub` を束ねることで ユースケース側はポートのトークンだけを知って利用できる
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
