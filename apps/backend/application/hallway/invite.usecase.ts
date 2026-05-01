import { Inject, Injectable } from "@nestjs/common";
import type { Invitation, MemberId, RoomId } from "@play.realtime/contracts";
import { canInvite, HallwayRepository } from "../../domain/hallway";
import { VibeRepository } from "../../domain/vibe";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { HallwayBroadcaster } from "./broadcaster";
import { ExpireHallwayInvitation } from "./expire-invitation.usecase";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * 未応答の招待の有効期限
 * 相手が席を外しているときの宙吊り時間を短く保つため 10 秒で自動失効する
 */
const INVITATION_TTL_MS = 10_000;

/**
 * 相手に「話しかける」招待を発行するユースケース
 * ドメインの発行可否判定で不変条件を検証し 招待を保存してからルーム全員へ `Invited` を配信する
 */
@Injectable()
export class InviteHallway {
  /**
   * 必要な永続化ポートと補助サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly ids: NanoidIdGenerator,
    private readonly timers: HallwayInvitationTimers,
    private readonly expirer: ExpireHallwayInvitation,
  ) {}

  /**
   * 取り込み状況と空気を同時取得し 発行可否検証 招待の保存 失効タイマー登録 配信の順で発行する
   * 検証失敗は `SelfInviteNotAllowed` や `InviterBusy` や `InviteeUnavailable` のいずれかが伝わる
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
   * 指定メンバーが 何らかの会話関連タスクを抱えているかを判定する
   * 未応答の送信済み招待 受信済み招待 進行中の通話のいずれかを持てば 取り込み中とみなす
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
