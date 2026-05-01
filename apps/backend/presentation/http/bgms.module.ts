import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GetBgmSnapshot } from "../../application/bgm/get-snapshot.usecase";
import { SetBgm } from "../../application/bgm/set.usecase";
import { StopBgm } from "../../application/bgm/stop.usecase";
import { UndoBgm } from "../../application/bgm/undo.usecase";
import { BgmRepository } from "../../domain/bgm";
import { InMemoryBgmRepository } from "../../infrastructure/repository/in-memory/bgm";
import { SseModule } from "../../infrastructure/transport/sse";
import { BgmsController } from "./bgms.controller";
import { UndoBySelfFilter } from "./filters/undo-by-self.filter";
import { UndoExpiredFilter } from "./filters/undo-expired.filter";
import { UndoUnavailableFilter } from "./filters/undo-unavailable.filter";
import { UnknownTrackFilter } from "./filters/unknown-track.filter";
import { RoomsModule } from "./rooms.module";

@Module({
  imports: [RoomsModule, SseModule],
  controllers: [BgmsController],
  providers: [
    SetBgm,
    StopBgm,
    UndoBgm,
    GetBgmSnapshot,
    {
      provide: BgmRepository,
      useClass: InMemoryBgmRepository,
    },
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
  exports: [BgmRepository],
})
export class BgmsModule {}
