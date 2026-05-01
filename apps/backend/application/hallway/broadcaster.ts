import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { RoomRepository } from "../../domain/room";
import { WsHub } from "../../infrastructure/transport/ws";
import { broadcastToMembers } from "./topic";

/**
 * 廊下トークの WebSocket 配信をルーム全体向けと特定メンバー向けに整理するサービス
 * メンバー単位のトピック構成上、配信範囲の選び分けが散らばりやすいため usecase 層の窓口としてここに集約する
 */
@Injectable()
export class HallwayBroadcaster {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly hub: WsHub,
  ) {}

  /**
   * ルーム在室メンバー全員宛に配信する、`Invited`、`InvitationEnded`、`CallStarted`、`CallEnded` など全員の UI 整合が必要なメッセージで使う
   * ルームが既に消えていれば静かに何もしない
   */
  async toRoom<T>(roomId: RoomId, name: string, data: T): Promise<void> {
    const room = await this.rooms.find(roomId);
    if (!room) {
      return;
    }
    const memberIds = room.members.map((each) => each.id);
    await broadcastToMembers(this.hub, roomId, memberIds, name, data);
  }

  /**
   * 指定メンバー集合だけに配信する、通話参加者向けの `Message` 配信などで使う
   */
  async toMembers<T>(
    roomId: RoomId,
    memberIds: readonly MemberId[],
    name: string,
    data: T,
  ): Promise<void> {
    await broadcastToMembers(this.hub, roomId, memberIds, name, data);
  }
}
