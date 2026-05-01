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

/**
 * バックエンドサーバー全体の組み立ての起点となる NestJS モジュール
 * グローバルモジュール (ID 発行 パブリッシュ購読 ルーム生命サイクル) と各機能モジュールを束ねて 起動時に依存性注入コンテナへ流し込む
 * 全 Repository を取り回せる位置として ルームの後片付け登録役もここで providers に入れる
 */
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
