import { Inject, Injectable } from "@nestjs/common";
import { Member, type MemberId, type Room, type RoomId } from "@play.realtime/contracts";
import { join, RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

@Injectable()
export class JoinRoom {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  async execute(input: {
    roomId: RoomId;
    name: string;
    existingMemberId?: MemberId;
  }): Promise<{ room: Room; member: Member }> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    if (input.existingMemberId) {
      const existing = room.members.find((each) => each.id === input.existingMemberId);
      if (existing) {
        return { room, member: existing };
      }
    }
    const member = Member.parse({
      id: this.ids.member(),
      name: input.name,
      joinedAt: new Date().toISOString(),
    });
    const updated = join(room, member);
    await this.rooms.save(updated);
    return { room: updated, member };
  }
}
