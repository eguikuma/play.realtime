import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";
import { HallwayInvitationTimers } from "./invitation-timers";

/**
 * WebSocket の最終接続が切れたメンバーに紐づく招待と通話を掃除する usecase
 * 発信中招待は `cancelled`、着信中招待は `declined`、通話は `disconnect` の終了理由で `InvitationEnded` と `CallEnded` を配信する
 * WebSocket 接続切断イベントは能動的な操作と区別できないため、発信側と受信側でそれぞれ自然な終了理由を当てる
 */
@Injectable()
export class CleanupHallwayOnDisconnect {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
    private readonly timers: HallwayInvitationTimers,
  ) {}

  async execute(input: { roomId: RoomId; memberId: MemberId }): Promise<void> {
    const [outgoing, incoming, call] = await Promise.all([
      this.hallway.findOutgoingInvitation(input.memberId),
      this.hallway.findIncomingInvitation(input.memberId),
      this.hallway.findCallForMember(input.memberId),
    ]);

    if (outgoing) {
      this.timers.cancel(outgoing.id);
      await this.hallway.deleteInvitation(outgoing.id);
      await this.broadcaster.invitationEnded(input.roomId, {
        invitationId: outgoing.id,
        reason: "cancelled" as const,
      });
    }

    if (incoming) {
      this.timers.cancel(incoming.id);
      await this.hallway.deleteInvitation(incoming.id);
      await this.broadcaster.invitationEnded(input.roomId, {
        invitationId: incoming.id,
        reason: "declined" as const,
      });
    }

    if (call) {
      await this.hallway.deleteCall(call.id);
      await this.broadcaster.callEnded(input.roomId, {
        callId: call.id,
        reason: "disconnect" as const,
      });
    }
  }
}
