import { Global, Module } from "@nestjs/common";
import { RoomPresence } from "../../application/room/presence";
import { PubSub } from "../../application/shared/ports/pubsub";
import { Environment } from "../../environment";
import { InMemoryRoomPresence } from "./in-memory";
import { RedisRoomPresence } from "./redis";

/**
 * `RoomPresence` トークンに driver 別実装を紐付ける Global モジュール
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、Controller / Gateway / Lifecycle の各注入箇所には実装の違いを意識させない
 * `redis` の場合は配信経路を `PubSub` port 越しに張り、Redis 直叩きを避けて in-memory pubsub への差し替えに将来対応できる構造にする
 */
@Global()
@Module({
  providers: [
    {
      provide: RoomPresence,
      useFactory: (environment: Environment, pubsub: PubSub) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisRoomPresence(environment.REDIS_URL as string, pubsub);
        }

        return new InMemoryRoomPresence();
      },
      inject: [Environment, PubSub],
    },
  ],
  exports: [RoomPresence],
})
export class PresenceModule {}
