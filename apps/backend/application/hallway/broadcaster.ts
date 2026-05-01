import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { RoomRepository } from "../../domain/room";
import { WsHub } from "../../infrastructure/transport/ws";
import { broadcastToMembers } from "./topic";

/**
 * 廊下トーク専用の配信を集約するサービス
 * 「ルーム全員へ」と「特定メンバー集合へ」の 2 種類をユースケース側から呼びやすく包む
 */
@Injectable()
export class HallwayBroadcaster {
  /**
   * ルームの永続化ポートと WebSocket ハブを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly hub: WsHub,
  ) {}

  /**
   * ルームの参加者全員にイベントを配信する
   * ルームが見つからない場合は何も送らずに正常終了する
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
   * 指定したメンバー集合にだけイベントを配信する
   * 通話中メッセージのような当事者限定の配信に使う
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
