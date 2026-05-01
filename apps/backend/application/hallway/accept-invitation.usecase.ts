import { Inject, Injectable } from "@nestjs/common";
import type { Call, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 自分宛の招待を承諾して通話へ昇格させるユースケース
 * 招待を削除し 招待終了 (承諾) と通話開始の 2 つのイベントを同じルームへ配信する
 */
@Injectable()
export class AcceptHallwayInvitation {
  /**
   * 必要な永続化ポートと補助サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly ids: NanoidIdGenerator,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 招待された側の検証から始まり タイマー取り消し 招待削除 終了配信 通話生成 開始配信の順に進む
   * 対応する招待が無いか 招待された側が一致しない場合は `InvitationNotFound` を投げる
   */
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
