import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 自分宛の招待を辞退するユースケース
 * タイマーを止めたうえで招待を削除し 招待終了 (辞退) をルームへ配信する
 */
@Injectable()
export class DeclineHallwayInvitation {
  /**
   * 必要な永続化ポートと補助サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 招待された側の検証から始まり タイマー取り消し 招待削除 終了配信の順に進む
   * 対応する招待が無いか 招待された側が一致しない場合は `InvitationNotFound` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    invitationId: InvitationId;
  }): Promise<void> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation || invitation.toMemberId !== input.memberId) {
      throw new InvitationNotFound(input.invitationId);
    }

    this.timers.cancel(input.invitationId);
    await this.hallway.deleteInvitation(input.invitationId);

    await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
      invitationId: input.invitationId,
      reason: "declined" as const,
    });
  }
}
