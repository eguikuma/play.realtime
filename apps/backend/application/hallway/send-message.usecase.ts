import { Inject, Injectable } from "@nestjs/common";
import type { CallId, CallMessage, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * 通話中にメッセージを送るユースケース
 * 保存は行わず 当事者 2 名にのみ `Message` イベントを配信する
 */
@Injectable()
export class SendHallwayMessage {
  /**
   * 廊下トークの永続化ポートと配信サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  /**
   * 通話の存在確認から始まり 参加者検証 メッセージの組み立て 当事者限定の配信の順に進む
   * 通話が無ければ `CallNotFound` 参加者でなければ `NotCallParticipant` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    callId: CallId;
    memberId: MemberId;
    text: string;
  }): Promise<void> {
    const call = await this.hallway.findCall(input.callId);
    if (!call) {
      throw new CallNotFound(input.callId);
    }
    if (!call.memberIds.includes(input.memberId)) {
      throw new NotCallParticipant(input.callId, input.memberId);
    }

    const message: CallMessage = {
      callId: call.id,
      fromMemberId: input.memberId,
      text: input.text,
      sentAt: new Date().toISOString(),
    };

    await this.broadcaster.toMembers(input.roomId, call.memberIds, "Message", { message });
  }
}
