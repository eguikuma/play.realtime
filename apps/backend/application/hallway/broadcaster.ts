import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { RoomRepository } from "../../domain/room";
import { WsHub } from "../../infrastructure/transport/ws";
import { broadcastToMembers } from "./topic";

@Injectable()
export class HallwayBroadcaster {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly hub: WsHub,
  ) {}

  async toRoom<T>(roomId: RoomId, name: string, data: T): Promise<void> {
    const room = await this.rooms.find(roomId);
    if (!room) {
      return;
    }
    const memberIds = room.members.map((each) => each.id);
    await broadcastToMembers(this.hub, roomId, memberIds, name, data);
  }

  async toMembers<T>(
    roomId: RoomId,
    memberIds: readonly MemberId[],
    name: string,
    data: T,
  ): Promise<void> {
    await broadcastToMembers(this.hub, roomId, memberIds, name, data);
  }
}
