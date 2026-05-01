import { Module } from "@nestjs/common";
import { AcceptHallwayInvitation } from "../../application/hallway/accept-invitation.usecase";
import { HallwayBroadcaster } from "../../application/hallway/broadcaster";
import { CancelHallwayInvitation } from "../../application/hallway/cancel-invitation.usecase";
import { HallwayConnectionCounter } from "../../application/hallway/connection-counter";
import { DeclineHallwayInvitation } from "../../application/hallway/decline-invitation.usecase";
import { ExpireHallwayInvitation } from "../../application/hallway/expire-invitation.usecase";
import { GetHallwaySnapshot } from "../../application/hallway/get-snapshot.usecase";
import { HandleHallwayDisconnect } from "../../application/hallway/handle-disconnect.usecase";
import { HallwayInvitationTimers } from "../../application/hallway/invitation-timers";
import { InviteHallway } from "../../application/hallway/invite.usecase";
import { LeaveHallwayCall } from "../../application/hallway/leave-call.usecase";
import { SendHallwayMessage } from "../../application/hallway/send-message.usecase";
import { HallwayRepository } from "../../domain/hallway";
import { InMemoryHallwayRepository } from "../../infrastructure/repository/in-memory/hallway";
import { WsModule } from "../../infrastructure/transport/ws";
import { VibesModule } from "../../presentation/http/vibes.module";
import { RoomsModule } from "../http/rooms.module";
import { HallwayGateway } from "./hallway.gateway";

/**
 * 廊下トーク機能を組み立てる Module
 * Hallway 固有の usecase / broadcaster / counter / timers に加えて、`VibesModule` から `VibeRepository` を取り込んで招待発行時の在室判定に使う
 */
@Module({
  imports: [RoomsModule, VibesModule, WsModule],
  providers: [
    HallwayGateway,
    HallwayBroadcaster,
    HallwayConnectionCounter,
    HallwayInvitationTimers,
    InviteHallway,
    AcceptHallwayInvitation,
    DeclineHallwayInvitation,
    CancelHallwayInvitation,
    ExpireHallwayInvitation,
    SendHallwayMessage,
    LeaveHallwayCall,
    HandleHallwayDisconnect,
    GetHallwaySnapshot,
    {
      provide: HallwayRepository,
      useClass: InMemoryHallwayRepository,
    },
  ],
  exports: [HallwayRepository],
})
export class HallwayModule {}
