import { Inject, Injectable } from "@nestjs/common";
import type {
  HallwayCallEnded,
  HallwayCallStarted,
  HallwayInvitationEnded,
  HallwayInvited,
  HallwayMessage,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { RoomRepository } from "../../domain/room";
import { WsHub } from "../../infrastructure/transport/ws";
import { broadcastToMembers } from "./topic";

/**
 * 廊下トークの WebSocket 配信のメッセージ別ファサード
 * usecase 層は `WsHub` を直接触らずこの broadcaster の各メソッド経由で配信し、辞書にないキーや payload 不一致をシグネチャ単位でコンパイル時に弾く
 * メンバー単位トピック構成上散らばりやすい配信範囲の判定をここに集約し、ルーム全員向けと特定メンバー集合向けを別メソッドに分ける
 */
@Injectable()
export class HallwayBroadcaster {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly hub: WsHub,
  ) {}

  /**
   * 招待発行をルーム在室メンバー全員に配信する
   * ルームが既に消えていれば静かに何もしない
   */
  async invited(roomId: RoomId, data: HallwayInvited): Promise<void> {
    const memberIds = await this.allMemberIds(roomId);
    if (!memberIds) {
      return;
    }
    await broadcastToMembers(this.hub, roomId, memberIds, "Invited", data);
  }

  /**
   * 招待終了をルーム在室メンバー全員に配信する
   * ルームが既に消えていれば静かに何もしない
   */
  async invitationEnded(roomId: RoomId, data: HallwayInvitationEnded): Promise<void> {
    const memberIds = await this.allMemberIds(roomId);
    if (!memberIds) {
      return;
    }
    await broadcastToMembers(this.hub, roomId, memberIds, "InvitationEnded", data);
  }

  /**
   * 通話成立をルーム在室メンバー全員に配信する
   * ルームが既に消えていれば静かに何もしない
   */
  async callStarted(roomId: RoomId, data: HallwayCallStarted): Promise<void> {
    const memberIds = await this.allMemberIds(roomId);
    if (!memberIds) {
      return;
    }
    await broadcastToMembers(this.hub, roomId, memberIds, "CallStarted", data);
  }

  /**
   * 通話終了をルーム在室メンバー全員に配信する
   * ルームが既に消えていれば静かに何もしない
   */
  async callEnded(roomId: RoomId, data: HallwayCallEnded): Promise<void> {
    const memberIds = await this.allMemberIds(roomId);
    if (!memberIds) {
      return;
    }
    await broadcastToMembers(this.hub, roomId, memberIds, "CallEnded", data);
  }

  /**
   * 通話中メッセージを参加者集合だけに配信する
   * 送信者本人にも同じ `memberIds` 経由で返すことで複数接続の表示を一致させる
   */
  async message(
    roomId: RoomId,
    memberIds: readonly MemberId[],
    data: HallwayMessage,
  ): Promise<void> {
    await broadcastToMembers(this.hub, roomId, memberIds, "Message", data);
  }

  private async allMemberIds(roomId: RoomId): Promise<MemberId[] | null> {
    const room = await this.rooms.find(roomId);
    if (!room) {
      return null;
    }
    return room.members.map((each) => each.id);
  }
}
