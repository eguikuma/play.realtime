import { Inject, Injectable } from "@nestjs/common";
import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";
import { MemberNotFound, RoomNotFound, RoomRepository } from "../../domain/room";

@Injectable()
export class GetRoomMembership {
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
  }): Promise<{ room: Room; member: Member }> {
    const room = await this.rooms.find(input.roomId);
    if (!room) throw new RoomNotFound(input.roomId);
    const member = room.members.find((each) => each.id === input.memberId);
    if (!member) throw new MemberNotFound(input.roomId, input.memberId);
    return { room, member };
  }
}
