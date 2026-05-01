import { Module } from "@nestjs/common";
import { AcceptHallwayInvitation } from "../../application/hallway/accept-invitation.usecase";
import { HallwayBroadcaster } from "../../application/hallway/broadcaster";
import { CancelHallwayInvitation } from "../../application/hallway/cancel-invitation.usecase";
import { CleanupHallwayOnDisconnect } from "../../application/hallway/cleanup-on-disconnect.usecase";
import { DeclineHallwayInvitation } from "../../application/hallway/decline-invitation.usecase";
import { ExpireHallwayInvitation } from "../../application/hallway/expire-invitation.usecase";
import { GetHallwaySnapshot } from "../../application/hallway/get-snapshot.usecase";
import { InviteHallway } from "../../application/hallway/invite.usecase";
import { LeaveHallwayCall } from "../../application/hallway/leave-call.usecase";
import { SendHallwayMessage } from "../../application/hallway/send-message.usecase";
import { WsModule } from "../../infrastructure/transport/ws";
import { RoomsModule } from "../http/rooms.module";
import { HallwayGateway } from "./hallway.gateway";

/**
 * 廊下トーク機能を組み立てる Module
 * Hallway 固有の usecase、broadcaster を束ね、`RoomsModule` から `GetRoomMembership` を取り込む
 * `RoomRepository`、`VibeRepository`、`HallwayRepository` 実装は Global の `RepositoryModule` から、`HallwayInvitationTimers` は `TimerModule` から、`HallwayConnectionCounter` は `CounterModule` から注入される
 */
@Module({
  imports: [RoomsModule, WsModule],
  providers: [
    HallwayGateway,
    HallwayBroadcaster,
    InviteHallway,
    AcceptHallwayInvitation,
    DeclineHallwayInvitation,
    CancelHallwayInvitation,
    ExpireHallwayInvitation,
    SendHallwayMessage,
    LeaveHallwayCall,
    CleanupHallwayOnDisconnect,
    GetHallwaySnapshot,
  ],
})
export class HallwayModule {}
