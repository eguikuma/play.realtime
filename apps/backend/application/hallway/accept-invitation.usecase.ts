import { Inject, Injectable } from "@nestjs/common";
import type { Call, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { acceptInvitation, HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 招待を受諾して通話を開始する usecase
 * `InvitationEnded(accepted)` と `CallStarted` の 2 本をルーム全体へ配信し、発行元メンバーと参加者以外にも取り込み中表示の切り替えを伝える
 */
@Injectable()
export class AcceptHallwayInvitation {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly ids: NanoidIdGenerator,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 招待の存在を確認した後、`acceptInvitation` で「受信者本人ガードと `Call` の組み立て」を domain に委ね、結果として返ってきた `Call` を永続化と配信に流す
   * 失効タイマー停止と招待削除を済ませてから `InvitationEnded(accepted)` を先に配信し、`Call` 保存後に `CallStarted` を配信することで UI の着信ダイアログが閉じてから通話画面が立ち上がる順序になる
   * 招待が見つからない、または受信者が自分でない場合は `InvitationNotFound` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    invitationId: InvitationId;
  }): Promise<Call> {
    const invitation = await this.hallway.findInvitation(input.invitationId);
    if (!invitation) {
      throw new InvitationNotFound(input.invitationId);
    }

    const { call } = acceptInvitation({
      invitation,
      callerId: input.memberId,
      callId: this.ids.call(),
      now: new Date(),
    });

    this.timers.cancel(input.invitationId);
    await this.hallway.deleteInvitation(input.invitationId);

    await this.broadcaster.invitationEnded(input.roomId, {
      invitationId: input.invitationId,
      reason: "accepted" as const,
    });

    await this.hallway.saveCall(call);

    await this.broadcaster.callStarted(input.roomId, { call });

    return call;
  }
}
