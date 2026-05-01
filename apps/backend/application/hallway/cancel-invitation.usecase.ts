import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 招待者本人が発行済みの招待を取り消す usecase
 * 失効タイマーと招待本体を消した後に `InvitationEnded(cancelled)` をルーム全体へ配信する
 */
@Injectable()
export class CancelHallwayInvitation {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 招待の存在と発行者一致を確認する
   * 他人の招待を勝手に Cancel するルートを塞ぐために発行者判定を必須にする
   * 招待が見つからない、または発行者が自分でない場合は `InvitationNotFound` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    invitationId: InvitationId;
  }): Promise<void> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation || invitation.fromMemberId !== input.memberId) {
      throw new InvitationNotFound(input.invitationId);
    }

    this.timers.cancel(input.invitationId);
    await this.hallway.deleteInvitation(input.invitationId);

    await this.broadcaster.invitationEnded(input.roomId, {
      invitationId: input.invitationId,
      reason: "cancelled" as const,
    });
  }
}
