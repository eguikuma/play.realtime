import { Inject, Injectable } from "@nestjs/common";
import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";
import { MemberNotFound, RoomNotFound, RoomRepository } from "../../domain/room";

/**
 * ルーム全景と呼び出し元メンバー本人を同時に返す usecase
 * `GET /rooms/{roomId}/me` から呼ばれ、クライアントは戻り値で自分自身を識別できる
 * ルームが見つからなければ `RoomNotFound`、メンバーが見つからなければ `MemberNotFound` を投げる
 */
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
