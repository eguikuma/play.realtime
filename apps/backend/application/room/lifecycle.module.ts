import { Global, Module } from "@nestjs/common";
import { load } from "../../environment";
import { PubSub } from "../ports/pubsub";
import { RoomLifecycle } from "./lifecycle";
import { RoomPresence } from "./presence";

/**
 * `RoomLifecycle` をアプリ全体へ提供する Global モジュール
 * `RoomPresence` 実装は Global の `PresenceModule` から注入され、ここでは grace timer を持つ Lifecycle 本体だけを組み立てる
 * `useFactory` で生成し、`ROOM_GRACE_MS` が既定値と異なる場合のみ `overrideGracePeriod` で差し替える
 */
@Global()
@Module({
  providers: [
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
  exports: [RoomLifecycle],
})
export class RoomLifecycleModule {}
