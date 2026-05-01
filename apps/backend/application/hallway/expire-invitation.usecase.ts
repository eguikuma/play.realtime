import { Inject, Injectable } from "@nestjs/common";
import type { InvitationId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * タイマー発火で招待を自動失効させるユースケース
 * すでに他経路で招待が消えている場合は何もせず 冪等に処理を終える
 */
@Injectable()
export class ExpireHallwayInvitation {
  /**
   * 必要な永続化ポートと配信サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  /**
   * 招待を検索し 存在すれば削除と 招待終了 (失効) の配信を行う
   * すでに削除済みの場合は静かに無視する
   */
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
