import { Inject, Injectable } from "@nestjs/common";
import type { CallId, CallMessage, MemberId, RoomId } from "@play.realtime/contracts";
import { CallNotFound, HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import { HallwayBroadcaster } from "./broadcaster";

/**
 * 通話中のテキストメッセージを通話参加者 2 人へ配信する usecase
 * サーバ側が `sentAt` を採番して `CallMessage` に仕立て、`Message` を送信者と受信者の両方へ配信することで複数接続の表示を揃える
 */
@Injectable()
export class SendHallwayMessage {
  constructor(
    @Inject(HallwayRepository) private readonly hallway: HallwayRepository,
    private readonly broadcaster: HallwayBroadcaster,
  ) {}

  /**
   * 通話の存在と送信者の参加判定を確認する
   * 通話が見つからなければ `CallNotFound`、参加者でなければ `NotCallParticipant` を投げる
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

    await this.broadcaster.message(input.roomId, call.memberIds, { message });
  }
}
