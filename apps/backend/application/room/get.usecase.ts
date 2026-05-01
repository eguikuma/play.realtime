import { Inject, Injectable } from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";

@Injectable()
export class GetRoom {
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  async execute(input: { id: RoomId }): Promise<Room> {
    const room = await this.rooms.find(input.id);
    if (!room) throw new RoomNotFound(input.id);
    return room;
  }
}
