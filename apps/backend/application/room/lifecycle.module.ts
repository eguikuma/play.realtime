import { Global, Module } from "@nestjs/common";
import { load } from "../../environment";
import { PubSub } from "../ports/pubsub";
import { RoomLifecycle } from "./lifecycle";
import { RoomPresence } from "./presence";

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
