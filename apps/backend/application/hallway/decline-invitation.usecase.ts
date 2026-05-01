import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { canDecline, HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 被招待者が招待を拒否する usecase
 * 失効タイマーと招待本体を消した後に `InvitationEnded(declined)` をルーム全体へ配信する
 */
@Injectable()
export class DeclineHallwayInvitation {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    @Inject(HallwayInvitationTimers) private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 招待の存在を確認した後、受信者本人かどうかは domain ガード `canDecline` で検証する
   * 他人の招待に Decline を投げつけるルートを塞ぐために受信者判定を必須にする
   * 招待が見つからない、または受信者が自分でない場合は `InvitationNotFound` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    invitationId: InvitationId;
  }): Promise<void> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation) {
      throw new InvitationNotFound(input.invitationId);
    }
    canDecline(invitation, input.memberId);

    this.timers.cancel(input.invitationId);
    await this.hallway.deleteInvitation(input.invitationId);

    await this.broadcaster.invitationEnded(input.roomId, {
      invitationId: input.invitationId,
      reason: "declined" as const,
    });
  }
}
