import { Inject, Injectable } from "@nestjs/common";
import { Member, type Room } from "@play.realtime/contracts";
import { create, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

@Injectable()
export class CreateRoom {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  async execute(input: { hostName: string }): Promise<{ room: Room; member: Member }> {
    const now = new Date().toISOString();
    const host = Member.parse({
      id: this.ids.member(),
      name: input.hostName,
      joinedAt: now,
    });
    const room = create({
      id: this.ids.room(),
      host,
      createdAt: now,
    });
    await this.rooms.save(room);
    return { room, member: host };
  }
}
