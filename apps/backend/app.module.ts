import { Module } from "@nestjs/common";
import { RoomCleanupRegistrar } from "./application/room/cleanup-registrar";
import { RoomLifecycleModule } from "./application/room/lifecycle.module";
import { EnvironmentModule } from "./environment.module";
import { IdModule } from "./infrastructure/id";
import { PubSubModule } from "./infrastructure/pubsub";
import { BgmsModule } from "./presentation/http/bgms.module";
import { HealthModule } from "./presentation/http/health.module";
import { MurmursModule } from "./presentation/http/murmurs.module";
import { RoomsModule } from "./presentation/http/rooms.module";
import { VibesModule } from "./presentation/http/vibes.module";
import { HallwayModule } from "./presentation/ws/hallway.module";

/**
 * アプリのルート Module
 * `IdModule`、`PubSubModule`、`RoomLifecycleModule` のグローバル基盤を先に載せ、続いて機能別モジュールを並べることで DI グラフの組み立て順序を視覚化する
 * `RoomCleanupRegistrar` はモジュール直下に置き、各リポジトリが登録済みの時点でクリーンアップハンドラを仕込めるようにする
 */
@Module({
  imports: [
    EnvironmentModule,
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
