import { Global, Module } from "@nestjs/common";
import { HallwayInvitationTimers } from "../../application/hallway/invitation-timers";
import { RoomLifecycleGrace } from "../../application/room/lifecycle-grace";
import { VibePresenceGrace } from "../../application/vibe/presence-grace";
import { Environment } from "../../environment";
import { InMemoryHallwayInvitationTimers } from "./in-memory/hallway-invitation-timers";
import { InMemoryRoomLifecycleGrace } from "./in-memory/room-lifecycle-grace";
import { InMemoryVibePresenceGrace } from "./in-memory/vibe-presence-grace";
import { RedisExpiredListener } from "./redis/expired-listener";
import { RedisHallwayInvitationTimers } from "./redis/hallway-invitation-timers";
import { RedisVibePresenceGrace } from "./redis/vibe-presence-grace";

/**
 * 猶予タイマー系 port に driver 別実装を紐付ける Global モジュール
 * `STORAGE_DRIVER` 環境変数で `memory` と `redis` を切り替え、usecase / Gateway / Lifecycle の各注入箇所には実装の違いを意識させない
 * Redis 実装はキースペース通知 + SETNX 短期ロックで複数 backend 間の二重配信を防ぐ前提で、本モジュールから差し替える
 * `RedisExpiredListener` は redis driver のときだけ生成され、各 Redis timer 実装が constructor で `register(prefix, handler)` を呼んで dispatch table を構築する
 */
@Global()
@Module({
  providers: [
    {
      provide: RedisExpiredListener,
      useFactory: (environment: Environment) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisExpiredListener(environment.REDIS_URL as string);
        }

        return null;
      },
      inject: [Environment],
    },
    {
      provide: VibePresenceGrace,
      useFactory: (environment: Environment, listener: RedisExpiredListener | null) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisVibePresenceGrace(
            environment.REDIS_URL as string,
            listener as RedisExpiredListener,
          );
        }

        return new InMemoryVibePresenceGrace();
      },
      inject: [Environment, RedisExpiredListener],
    },
    {
      provide: HallwayInvitationTimers,
      useFactory: (environment: Environment, listener: RedisExpiredListener | null) => {
        if (environment.STORAGE_DRIVER === "redis") {
          return new RedisHallwayInvitationTimers(
            environment.REDIS_URL as string,
            listener as RedisExpiredListener,
          );
        }

        return new InMemoryHallwayInvitationTimers();
      },
      inject: [Environment, RedisExpiredListener],
    },
    {
      provide: RoomLifecycleGrace,
      useFactory: () => new InMemoryRoomLifecycleGrace(),
    },
  ],
  exports: [VibePresenceGrace, HallwayInvitationTimers, RoomLifecycleGrace],
})
export class TimerModule {}
