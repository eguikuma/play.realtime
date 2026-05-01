import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

@Injectable()
export class ExpireHallwayInvitation {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  async execute(input: { roomId: RoomId; invitationId: InvitationId }): Promise<void> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation) {
      return;
    }
    await this.hallway.deleteInvitation(input.invitationId);
    await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
      invitationId: input.invitationId,
      reason: "expired" as const,
    });
  }
}
