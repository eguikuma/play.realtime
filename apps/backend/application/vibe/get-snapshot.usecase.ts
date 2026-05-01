import { Inject, Injectable } from "@nestjs/common";
import type { RoomId, VibeSnapshot } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";

@Injectable()
export class GetVibeSnapshot {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
  ) {}

  async execute(input: { roomId: RoomId }): Promise<VibeSnapshot> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const statuses = await this.vibes.snapshot(input.roomId);
    return { members: room.members, statuses };
  }
}
