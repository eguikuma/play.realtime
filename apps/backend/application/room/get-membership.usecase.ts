import { Inject, Injectable } from "@nestjs/common";
import type { Member, MemberId, Room, RoomId } from "@play.realtime/contracts";
import { MemberNotFound, RoomNotFound, RoomRepository } from "../../domain/room";

/**
 * cookie セッションと URL から 自身の所属ルームとメンバー情報を復元するユースケース
 * リロードにも耐える「私は誰で どのルームの参加者か」を解決する起点となる
 */
@Injectable()
export class GetRoomMembership {
  /**
   * ルームの永続化ポートを依存性注入で受け取る
   */
  constructor(@Inject(RoomRepository) private readonly rooms: RoomRepository) {}

  /**
   * ルームとメンバーの存在を順に検証し 両方が揃った組を返す
   * ルームが無ければ `RoomNotFound` を メンバーが無ければ `MemberNotFound` を投げる
   */
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
