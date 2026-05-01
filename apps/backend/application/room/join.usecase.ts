import { Inject, Injectable } from "@nestjs/common";
import { Member, type MemberId, type Room, type RoomId } from "@play.realtime/contracts";
import { join, RoomNotFound, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

/**
 * 既存ルームへメンバーを追加する usecase
 * ブラウザリロード直後の再入室では既存 `MemberId` をそのまま返して冪等にし、新規参加者の場合のみ `Member` を採番して `join` する
 */
@Injectable()
export class JoinRoom {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * `roomId` の存在を確認し、`existingMemberId` が既に登録済みなら新規採番せずに同じメンバーを返す
   * 未登録なら新しい `Member` を生成して `join` し、更新後のルームを保存する
   * ルームが見つからなければ `RoomNotFound` を投げる
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
