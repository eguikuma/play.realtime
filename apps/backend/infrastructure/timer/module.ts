import { Global, Module } from "@nestjs/common";
import { HallwayInvitationTimers } from "../../application/hallway/invitation-timers";
import { VibePresenceGrace } from "../../application/vibe/presence-grace";
import { InMemoryHallwayInvitationTimers } from "./in-memory/hallway-invitation-timers";
import { InMemoryVibePresenceGrace } from "./in-memory/vibe-presence-grace";

/**
 * 猶予タイマー系 port に driver 別実装を紐付ける Global モジュール
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、usecase / Gateway 等の各注入箇所には実装の違いを意識させない
 * Redis 実装はキースペース通知 + SETNX 短期ロックで複数 backend 間の二重配信を防ぐ前提で、本モジュールから差し替える
 */
@Global()
@Module({
  providers: [
    {
      provide: VibePresenceGrace,
      useFactory: () => new InMemoryVibePresenceGrace(),
    },
    {
      provide: HallwayInvitationTimers,
      useFactory: () => new InMemoryHallwayInvitationTimers(),
    },
  ],
  exports: [VibePresenceGrace, HallwayInvitationTimers],
})
export class TimerModule {}
