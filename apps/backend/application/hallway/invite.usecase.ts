import { Inject, Injectable } from "@nestjs/common";
import type { Invitation, MemberId, RoomId } from "@play.realtime/contracts";
import { canInvite, HallwayRepository } from "../../domain/hallway";
import { VibeRepository } from "../../domain/vibe";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { ExpireHallwayInvitation } from "./expire-invitation.usecase";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 招待の有効時間、10 秒以内に相手が応答しなければ自動で `expired` として終わらせる
 */
const INVITATION_TTL_MS = 10_000;

/**
 * 廊下トークの招待を発行する usecase
 * 取り込み中判定と Vibe の在室判定を並列で取得し、`canInvite` のガードを通ってから永続化と SSE 配信を走らせる
 */
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

  /**
   * 招待者 / 被招待者の取り込み状況と被招待者の Vibe を並列取得し、`canInvite` で不成立ケースを弾く
   * 招待を保存した後に 10 秒の失効タイマーを登録し、`Invited` をルーム全体へ配信する
   */
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

  /**
   * 対象メンバーが発信中招待 / 着信中招待 / 通話中のいずれかに該当すれば取り込み中と判定する
   */
  private async isBusy(memberId: MemberId): Promise<boolean> {
    const [outgoing, incoming, call] = await Promise.all([
      this.hallway.findOutgoingInvitation(memberId),
      this.hallway.findIncomingInvitation(memberId),
      this.hallway.findCallForMember(memberId),
    ]);
    return outgoing !== null || incoming !== null || call !== null;
  }
}
