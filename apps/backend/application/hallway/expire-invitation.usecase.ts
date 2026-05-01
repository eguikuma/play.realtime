import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * 招待の TTL 到来時に `HallwayInvitationTimers` から呼ばれる自動失効 usecase
 * 既に `Accept` / `Decline` / `Cancel` / 切断で消えていた場合は何もせず静かに終わらせる
 */
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
