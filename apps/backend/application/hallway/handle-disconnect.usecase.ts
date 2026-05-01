import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

@Injectable()
export class HandleHallwayDisconnect {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  async execute(input: { roomId: RoomId; memberId: MemberId }): Promise<void> {
    const [outgoing, incoming, call] = await Promise.all([
      this.hallway.findOutgoingInvitation(input.memberId),
      this.hallway.findIncomingInvitation(input.memberId),
      this.hallway.findCallForMember(input.memberId),
    ]);

    if (outgoing) {
      this.timers.cancel(outgoing.id);
      await this.hallway.deleteInvitation(outgoing.id);
      await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
        invitationId: outgoing.id,
        reason: "cancelled" as const,
      });
    }

    if (incoming) {
      this.timers.cancel(incoming.id);
      await this.hallway.deleteInvitation(incoming.id);
      await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
        invitationId: incoming.id,
        reason: "declined" as const,
      });
    }

    if (call) {
      await this.hallway.deleteCall(call.id);
      await this.broadcaster.toRoom(input.roomId, "CallEnded", {
        callId: call.id,
        reason: "disconnect" as const,
      });
    }
  }
}
