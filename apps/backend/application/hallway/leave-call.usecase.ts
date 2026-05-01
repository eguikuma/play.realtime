import { Inject, Injectable } from "@nestjs/common";
import type { CallId, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * 通話を明示的に終了するユースケース
 * 通話を削除して 通話終了 (明示終了) をルームへ配信する
 */
@Injectable()
export class LeaveHallwayCall {
  /**
   * 廊下トークの永続化ポートと配信サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  /**
   * 通話の存在確認から始まり 参加者検証 通話削除 終了配信の順に進む
   * 通話が無ければ `CallNotFound` 参加者でなければ `NotCallParticipant` を投げる
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

    await this.broadcaster.toRoom(input.roomId, "CallEnded", {
      callId: input.callId,
      reason: "explicit" as const,
    });
  }
}
