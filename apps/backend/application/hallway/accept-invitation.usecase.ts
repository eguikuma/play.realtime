import { Inject, Injectable } from "@nestjs/common";
import type { Call, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

@Injectable()
export class AcceptHallwayInvitation {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly ids: NanoidIdGenerator,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    invitationId: InvitationId;
  }): Promise<Call> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation || invitation.toMemberId !== input.memberId) {
      throw new InvitationNotFound(input.invitationId);
    }

    this.timers.cancel(input.invitationId);
    await this.hallway.deleteInvitation(input.invitationId);

    await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
      invitationId: input.invitationId,
      reason: "accepted" as const,
    });

    const call: Call = {
      id: this.ids.call(),
      roomId: input.roomId,
      memberIds: [invitation.fromMemberId, invitation.toMemberId],
      startedAt: new Date().toISOString(),
    };
    await this.hallway.saveCall(call);

    await this.broadcaster.toRoom(input.roomId, "CallStarted", { call });

    return call;
  }
}
