import { Inject, Injectable } from "@nestjs/common";
import type { Murmur, RoomId } from "@play.realtime/contracts";
import { MurmurRepository } from "../../domain/murmur";

const LATEST_LIMIT = 50;

@Injectable()
export class GetMurmurSnapshot {
  constructor(@Inject(MurmurRepository) private readonly murmurs: MurmurRepository) {}

  async execute(input: { roomId: RoomId }): Promise<Murmur[]> {
    return this.murmurs.latest(input.roomId, LATEST_LIMIT);
  }
}
