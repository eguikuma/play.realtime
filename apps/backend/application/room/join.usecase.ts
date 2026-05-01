import { Inject, Injectable } from "@nestjs/common";
import { Member, type MemberId, type Room, type RoomId } from "@play.realtime/contracts";
import { join, RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

/**
 * 既存ルームに新規メンバーとして参加するユースケース
 * メンバー ID と参加時刻をここで発行して ドメインの参加処理に渡す
 * 既参加のメンバー ID が入力として渡された場合は冪等に既存メンバーを返す
 */
@Injectable()
export class JoinRoom {
  /**
   * ルームの永続化ポートと ID 生成器を依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * ルームの検証から始まり メンバーの組み立て ドメインの参加処理 保存の順に進めて参加させる
   * 既存メンバー ID が渡されてルームに残っていれば ドメインには触れず既存情報を返す (リロードや一時切断からの復帰経路)
   * ルームが存在しなければ `RoomNotFound` を投げる
   */
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
