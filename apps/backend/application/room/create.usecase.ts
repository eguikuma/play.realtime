import { Inject, Injectable } from "@nestjs/common";
import { Member, type Room } from "@play.realtime/contracts";
import { create, RoomRepository } from "../../domain/room";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";

/**
 * ホストの名前から新規ルームを作成するユースケース
 * メンバーとルームの 2 つの ID と作成時刻をここで発行して ドメインに渡す
 */
@Injectable()
export class CreateRoom {
  /**
   * ルームの永続化ポートと ID 生成器を依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * ホストのメンバー情報を組み立ててから ドメインの組み立て関数を通してルームを保存する
   * 返り値は作成直後のルームとホストメンバーの組で プレゼンテーション側が cookie セッションにも使う
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
