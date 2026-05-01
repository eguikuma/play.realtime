import { Inject, Injectable } from "@nestjs/common";
import type { CallId, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * 通話から明示的に退出する usecase
 * 通話を削除して `CallEnded(explicit)` をルーム全体へ配信し、参加者以外のメンバーも取り込み中表示を解除できるようにする
 */
@Injectable()
export class LeaveHallwayCall {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  /**
   * 通話の存在と退出者の参加判定を確認する
   * 通話が見つからなければ `CallNotFound`、参加者でなければ `NotCallParticipant` を投げる
   */
  async execute(input: { roomId: RoomId; callId: CallId; memberId: MemberId }): Promise<void> {
    const call = await this.hallway.findCall(input.callId);
    if (!call) {
      throw new CallNotFound(input.callId);
    }
    if (!call.memberIds.includes(input.memberId)) {
      throw new NotCallParticipant(input.callId, input.memberId);
    }

    await this.hallway.deleteCall(input.callId);

    await this.broadcaster.callEnded(input.roomId, {
      callId: input.callId,
      reason: "explicit" as const,
    });
  }
}
