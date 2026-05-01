import { Inject, Injectable } from "@nestjs/common";
import type { BgmSnapshot, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";

@Injectable()
export class GetBgmSnapshot {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
  ) {}

  async execute(input: { roomId: RoomId }): Promise<BgmSnapshot> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const state = (await this.bgms.get(input.roomId)) ?? empty();
    return { state };
  }
}
