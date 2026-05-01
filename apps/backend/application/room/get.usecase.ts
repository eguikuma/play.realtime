import { Inject, Injectable } from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";

/**
 * 指定 ID のルームを取得するユースケース
 * 参加検証を伴わない単純な閲覧用であり 未知の ID は `RoomNotFound` を投げる
 */
@Injectable()
export class GetRoom {
  /**
   * ルームの永続化ポートを依存性注入で受け取る
   */
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  /**
   * 指定 ID のルームを返し 存在しなければ `RoomNotFound` を投げる
   */
  async execute(input: { id: RoomId }): Promise<Room> {
    const room = await this.rooms.find(input.id);
    if (!room) throw new RoomNotFound(input.id);
    return room;
  }
}
