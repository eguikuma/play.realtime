import { Inject, Injectable } from "@nestjs/common";
import { Member, type Room } from "@play.realtime/contracts";
import { create, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

/**
 * ホストが新しいルームを作成し、自分自身を最初のメンバーとして登録する usecase
 */
@Injectable()
export class CreateRoom {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * 受け取ったホスト名で `Member` と `Room` を生成し、永続化してから両方を返す
   * ID 採番と `joinedAt` / `createdAt` は usecase 側で確定させ、ドメイン層には完成した値だけを渡す
   */
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
