import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { BgmBroadcaster } from "../../application/bgm/broadcaster";
import { GetBgmSnapshot } from "../../application/bgm/get-snapshot.usecase";
import { SetBgm } from "../../application/bgm/set.usecase";
import { StopBgm } from "../../application/bgm/stop.usecase";
import { UndoBgm } from "../../application/bgm/undo.usecase";
import { SseModule } from "../../infrastructure/transport/sse";
import { BgmsController } from "./bgms.controller";
import { UndoBySelfFilter } from "./filters/undo-by-self.filter";
import { UndoExpiredFilter } from "./filters/undo-expired.filter";
import { UndoUnavailableFilter } from "./filters/undo-unavailable.filter";
import { UnknownTrackFilter } from "./filters/unknown-track.filter";
import { RoomsModule } from "./rooms.module";

/**
 * BGM 機能を組み立てる Module
 * undo 関連の Domain Error を HTTP へ変換する 4 つの ExceptionFilter を `APP_FILTER` として登録し、Controller 側に try catch を書かずに済ませる
 * `BgmRepository` 実装は Global の `RepositoryModule` から注入される
 */
@Module({
  imports: [RoomsModule, SseModule],
  controllers: [BgmsController],
  providers: [
    SetBgm,
    StopBgm,
    UndoBgm,
    GetBgmSnapshot,
    BgmBroadcaster,
    {
      provide: APP_FILTER,
      useClass: UnknownTrackFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UndoExpiredFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UndoUnavailableFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UndoBySelfFilter,
    },
  ],
})
export class BgmsModule {}
