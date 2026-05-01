import { Injectable } from "@nestjs/common";
import type {
  HallwayCallEnded,
  HallwayCallStarted,
  HallwayInvitationEnded,
  HallwayInvited,
  HallwayMessage,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { WsHub } from "../../infrastructure/transport/ws";
import { Topic } from "./topic";

/**
 * 廊下トークの WebSocket 配信のメッセージ別ファサード
 * usecase 層は `WsHub` を直接触らずこの broadcaster の各メソッド経由で配信し、辞書にないキーや payload 不一致をシグネチャ単位でコンパイル時に弾く
 * 招待や通話の開始終了はルーム全体トピックに 1 度だけ配信し、テキストメッセージは通話参加者 2 名のメンバー単位トピックに分けて、配信範囲をトピック名で明示する
 */
@Injectable()
export class HallwayBroadcaster {
  constructor(private readonly hub: WsHub) {}

  /**
   * 招待発行をルーム全員に向けてルーム単位トピックへ配信する
   */
  async invited(roomId: RoomId, data: HallwayInvited): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "Invited", data);
  }

  /**
   * 招待終了をルーム全員に向けてルーム単位トピックへ配信する
   */
  async invitationEnded(roomId: RoomId, data: HallwayInvitationEnded): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "InvitationEnded", data);
  }

  /**
   * 通話成立をルーム全員に向けてルーム単位トピックへ配信する
   */
  async callStarted(roomId: RoomId, data: HallwayCallStarted): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "CallStarted", data);
  }

  /**
   * 通話終了をルーム全員に向けてルーム単位トピックへ配信する
   */
  async callEnded(roomId: RoomId, data: HallwayCallEnded): Promise<void> {
    await this.hub.broadcast(Topic.room(roomId), "CallEnded", data);
  }

  /**
   * 通話メッセージを参加者集合だけに向けてメンバー単位トピックへ配信する
   * 送信者本人にも `memberIds` 経由で返すことで複数接続の表示を一致させる
   * ルーム全体ではなくメンバー単位トピックに分けることで、参加者以外への漏出を backend のトピック分離で塞ぐ
   */
  async message(
    roomId: RoomId,
    memberIds: readonly MemberId[],
    data: HallwayMessage,
  ): Promise<void> {
    await Promise.all(
      memberIds.map((memberId) =>
        this.hub.broadcast(Topic.message(roomId, memberId), "Message", data),
      ),
    );
  }
}
