import { Module } from "@nestjs/common";
import { RoomCleanupRegistrar } from "./application/room/cleanup-registrar";
import { RoomLifecycleModule } from "./application/room/lifecycle.module";
import { IdModule } from "./infrastructure/id";
import { PubSubModule } from "./infrastructure/pubsub";
import { BgmsModule } from "./presentation/http/bgms.module";
import { HealthModule } from "./presentation/http/health.module";
import { MurmursModule } from "./presentation/http/murmurs.module";
import { RoomsModule } from "./presentation/http/rooms.module";
import { VibesModule } from "./presentation/http/vibes.module";
import { HallwayModule } from "./presentation/ws/hallway.module";

@Module({
  imports: [
    IdModule,
    PubSubModule,
    RoomLifecycleModule,
    HealthModule,
    RoomsModule,
    MurmursModule,
    VibesModule,
    BgmsModule,
    HallwayModule,
  ],
  providers: [RoomCleanupRegistrar],
})
export class AppModule {}
