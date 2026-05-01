import { Inject, Injectable } from "@nestjs/common";
import type { Invitation, MemberId, RoomId } from "@play.realtime/contracts";
import { canInvite, HallwayRepository } from "../../domain/hallway";
import { VibeRepository } from "../../domain/vibe";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { ExpireHallwayInvitation } from "./expire-invitation.usecase";
import { HallwayInvitationTimers } from "./invitation-timers";

const INVITATION_TTL_MS = 10_000;

@Injectable()
export class InviteHallway {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly ids: NanoidIdGenerator,
    private readonly timers: HallwayInvitationTimers,
    private readonly expirer: ExpireHallwayInvitation,
  ) {}

  async execute(input: {
    roomId: RoomId;
    inviterId: MemberId;
    inviteeId: MemberId;
  }): Promise<Invitation> {
    const [inviterBusy, inviteeBusy, inviteeStatus] = await Promise.all([
      this.isBusy(input.inviterId),
      this.isBusy(input.inviteeId),
      this.vibes.get(input.roomId, input.inviteeId),
    ]);

    canInvite({
      inviter: { id: input.inviterId, busy: inviterBusy },
      invitee: {
        id: input.inviteeId,
        busy: inviteeBusy,
        present: inviteeStatus === "present",
      },
    });

    const invitation: Invitation = {
      id: this.ids.invitation(),
      roomId: input.roomId,
      fromMemberId: input.inviterId,
      toMemberId: input.inviteeId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
    };
    await this.hallway.saveInvitation(invitation);

    this.timers.register(invitation.id, INVITATION_TTL_MS, () => {
      void this.expirer.execute({ roomId: input.roomId, invitationId: invitation.id });
    });

    await this.broadcaster.toRoom(input.roomId, "Invited", { invitation });

    return invitation;
  }

  private async isBusy(memberId: MemberId): Promise<boolean> {
    const [outgoing, incoming, call] = await Promise.all([
      this.hallway.findOutgoingInvitation(memberId),
      this.hallway.findIncomingInvitation(memberId),
      this.hallway.findCallForMember(memberId),
    ]);
    return outgoing !== null || incoming !== null || call !== null;
  }
}
