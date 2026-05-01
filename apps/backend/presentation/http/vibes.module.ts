import { Module } from "@nestjs/common";
import { ChangeVibeStatus } from "../../application/vibe/change-status.usecase";
import { GetVibeSnapshot } from "../../application/vibe/get-snapshot.usecase";
import { NotifyVibeJoined } from "../../application/vibe/notify-joined.usecase";
import { NotifyVibeLeft } from "../../application/vibe/notify-left.usecase";
import { VibePresenceGrace } from "../../application/vibe/presence-grace";
import { VibeRepository } from "../../domain/vibe";
import { InMemoryVibeRepository } from "../../infrastructure/repository/in-memory/vibe";
import { SseModule } from "../../infrastructure/transport/sse";
import { RoomsModule } from "./rooms.module";
import { VibesController } from "./vibes.controller";

@Module({
  imports: [RoomsModule, SseModule],
  controllers: [VibesController],
  providers: [
    NotifyVibeJoined,
    NotifyVibeLeft,
    VibePresenceGrace,
    ChangeVibeStatus,
    GetVibeSnapshot,
    {
      provide: VibeRepository,
      useClass: InMemoryVibeRepository,
    },
  ],
  exports: [VibeRepository],
})
export class VibesModule {}
