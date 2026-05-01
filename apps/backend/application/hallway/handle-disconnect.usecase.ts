import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * WebSocket 接続が切れたメンバーに関わる招待と通話を一括で後始末するユースケース
 * 送信済み招待は取り消し 受信済み招待は辞退 通話は切断として 招待終了または通話終了のイベントを配信する
 */
@Injectable()
export class HandleHallwayDisconnect {
  /**
   * 必要な永続化ポートと補助サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  /**
   * 送信済み 受信済み 通話の 3 系列を同時取得してから 同じ順で片付ける
   * 他経路ですでに消えているものには触れず 冪等に処理を終える
   */
  async execute(input: { roomId: RoomId; memberId: MemberId }): Promise<void> {
    const [outgoing, incoming, call] = await Promise.all([
      this.hallway.findOutgoingInvitation(input.memberId),
      this.hallway.findIncomingInvitation(input.memberId),
      this.hallway.findCallForMember(input.memberId),
    ]);

    if (outgoing) {
      this.timers.cancel(outgoing.id);
      await this.hallway.deleteInvitation(outgoing.id);
      await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
        invitationId: outgoing.id,
        reason: "cancelled" as const,
      });
    }

    if (incoming) {
      this.timers.cancel(incoming.id);
      await this.hallway.deleteInvitation(incoming.id);
      await this.broadcaster.toRoom(input.roomId, "InvitationEnded", {
        invitationId: incoming.id,
        reason: "declined" as const,
      });
    }

    if (call) {
      await this.hallway.deleteCall(call.id);
      await this.broadcaster.toRoom(input.roomId, "CallEnded", {
        callId: call.id,
        reason: "disconnect" as const,
      });
    }
  }
}
