import { Inject, Injectable } from "@nestjs/common";
import { HallwayServerMessages, type MemberId, type RoomId } from "@play.realtime/contracts";
import type { z } from "zod";
import { RoomRepository } from "../../domain/room";
import { WsHub } from "../../infrastructure/transport/ws";
import { broadcastToMembers } from "./topic";

/**
 * `HallwayServerMessages` 辞書のキーに限定される配信メッセージ種別
 * `HallwayBroadcaster.toRoom` と `toMembers` の `name` 引数を型で束縛する
 */
type ServerMessageName = Extract<keyof typeof HallwayServerMessages, string>;

/**
 * 廊下トークの WebSocket 配信をルーム全体向けと特定メンバー向けに整理するサービス
 * メンバー単位のトピック構成上、配信範囲の選び分けが散らばりやすいため usecase 層の窓口としてここに集約する
 * `name` と `data` は `HallwayServerMessages` 辞書で型が束縛され、辞書にないキーや payload 不一致を呼び出し側で弾く
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
  async toRoom<K extends ServerMessageName>(
    roomId: RoomId,
    name: K,
    data: z.infer<(typeof HallwayServerMessages)[K]>,
  ): Promise<void> {
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
  async toMembers<K extends ServerMessageName>(
    roomId: RoomId,
    memberIds: readonly MemberId[],
    name: K,
    data: z.infer<(typeof HallwayServerMessages)[K]>,
  ): Promise<void> {
    await broadcastToMembers(this.hub, roomId, memberIds, name, data);
  }
}
