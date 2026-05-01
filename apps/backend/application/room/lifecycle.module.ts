import { Global, Module } from "@nestjs/common";
import { load } from "../../environment";
import { PubSub } from "../ports/pubsub";
import { RoomLifecycle } from "./lifecycle";
import { RoomPresence } from "./presence";

/**
 * `RoomPresence` と `RoomLifecycle` をアプリ全体へ提供する Global モジュール
 * `useFactory` で生成し、`ROOM_GRACE_MS` が既定値と異なる場合のみ `overrideGracePeriod` で差し替える
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
