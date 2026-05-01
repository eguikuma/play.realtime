import { Global, Module } from "@nestjs/common";
import { load } from "../../environment";
import { PubSub } from "../shared/ports/pubsub";
import { RoomLifecycle } from "./lifecycle";
import { RoomLifecycleGrace } from "./lifecycle-grace";
import { RoomPresence } from "./presence";

/**
 * `RoomLifecycle` をアプリ全体へ提供する Global モジュール
 * `RoomPresence` 実装は `PresenceModule`、`RoomLifecycleGrace` 実装は `TimerModule` から注入され、ここでは Lifecycle 本体の組み立てとクリーンアップ受付に専念する
 * `useFactory` で生成し、`ROOM_GRACE_MS` が既定値と異なる場合のみ `overrideGracePeriod` で差し替える
 */
@Global()
@Module({
  providers: [
    {
      provide: RoomLifecycle,
      useFactory: (presence: RoomPresence, pubsub: PubSub, grace: RoomLifecycleGrace) => {
        const lifecycle = new RoomLifecycle(presence, pubsub, grace);
        const { ROOM_GRACE_MS } = load();
        if (ROOM_GRACE_MS !== 30_000) {
          lifecycle.overrideGracePeriod(ROOM_GRACE_MS);
        }
        return lifecycle;
      },
      inject: [RoomPresence, PubSub, RoomLifecycleGrace],
    },
  ],
  exports: [RoomLifecycle],
})
export class RoomLifecycleModule {}
