import { Inject, Injectable } from "@nestjs/common";
import type { MemberId, Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository, post } from "../../domain/murmur";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

@Injectable()
export class PostMurmur {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(MurmurRepository) private readonly murmurs: MurmurRepository,
    private readonly ids: NanoidIdGenerator,
    private readonly hub: SseHub,
  ) {}

  async execute(input: { roomId: RoomId; memberId: MemberId; text: string }): Promise<Murmur> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const murmur = post({
      id: this.ids.murmur(),
      roomId: input.roomId,
      memberId: input.memberId,
      text: input.text,
      postedAt: new Date().toISOString(),
    });
    await this.murmurs.save(murmur);
    await this.hub.broadcast(topic(input.roomId), "Posted", murmur, murmur.id);
    return murmur;
  }
}
