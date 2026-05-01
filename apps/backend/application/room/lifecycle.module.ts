import { Global, Module } from "@nestjs/common";
import { load } from "../../environment";
import { PubSub } from "../ports/pubsub";
import { RoomLifecycle } from "./lifecycle";
import { RoomPresence } from "./presence";

/**
 * ルーム生命サイクルの土台を全機能で共有する グローバルな NestJS モジュール
 * 在室遷移と後片付けの中核 2 サービスを 機能モジュールの DI から自由に引けるようにする
 */
@Global()
@Module({
  providers: [
    RoomPresence,
    {
      provide: RoomLifecycle,
      useFactory: (presence: RoomPresence, pubsub: PubSub) => {
        const lifecycle = new RoomLifecycle(presence, pubsub);
        const { ROOM_GRACE_MS } = load();
        if (ROOM_GRACE_MS !== 30_000) {
          lifecycle.overrideGracePeriod(ROOM_GRACE_MS);
        }
        return lifecycle;
      },
      inject: [RoomPresence, PubSub],
    },
  ],
  exports: [RoomPresence, RoomLifecycle],
})
export class RoomLifecycleModule {}
