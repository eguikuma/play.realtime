import { Inject, Injectable } from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";

/**
 * ID からルーム 1 件を取得する usecase
 * 存在しない場合は `RoomNotFound` を投げ、HTTP では 404 へ変換される
 */
@Injectable()
export class GetRoom {
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  async execute(input: { id: RoomId }): Promise<Room> {
    const room = await this.rooms.find(input.id);
    if (!room) throw new RoomNotFound(input.id);
    return room;
  }
}
