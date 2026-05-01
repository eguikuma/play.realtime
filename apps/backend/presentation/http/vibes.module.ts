import { Module } from "@nestjs/common";
import { VibeBroadcaster } from "../../application/vibe/broadcaster";
import { ChangeVibeStatus } from "../../application/vibe/change-status.usecase";
import { GetVibeSnapshot } from "../../application/vibe/get-snapshot.usecase";
import { NotifyVibeJoined } from "../../application/vibe/notify-joined.usecase";
import { NotifyVibeLeft } from "../../application/vibe/notify-left.usecase";
import { VibePresenceGrace } from "../../application/vibe/presence-grace";
import { SseModule } from "../../infrastructure/transport/sse";
import { RoomsModule } from "./rooms.module";
import { VibesController } from "./vibes.controller";

/**
 * Vibe 機能を組み立てる Module
 * 4 つの usecase と `VibePresenceGrace` をまとめ、`RoomsModule` からルーム情報を、`SseModule` から配信経路を注入する
 * `VibeRepository` 実装は Global の `RepositoryModule` から注入される
 */
@Module({
  imports: [RoomsModule, SseModule],
  controllers: [VibesController],
  providers: [
    NotifyVibeJoined,
    NotifyVibeLeft,
    VibePresenceGrace,
    ChangeVibeStatus,
    GetVibeSnapshot,
    VibeBroadcaster,
  ],
})
export class VibesModule {}
