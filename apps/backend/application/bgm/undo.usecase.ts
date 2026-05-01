import { Inject, Injectable } from "@nestjs/common";
import type { BgmState, MemberId, RoomId } from "@play.realtime/contracts";
import { BgmRepository, empty, undo } from "../../domain/bgm";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

@Injectable()
export class UndoBgm {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(BgmRepository) private readonly bgms: BgmRepository,
    private readonly hub: SseHub,
  ) {}

  async execute(input: { roomId: RoomId; memberId: MemberId; now: Date }): Promise<BgmState> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const current = (await this.bgms.get(input.roomId)) ?? empty();
    const next = undo(current, { memberId: input.memberId, now: input.now });
    await this.bgms.save(input.roomId, next);
    await this.hub.broadcast(topic(input.roomId), "Changed", { state: next });
    return next;
  }
}
