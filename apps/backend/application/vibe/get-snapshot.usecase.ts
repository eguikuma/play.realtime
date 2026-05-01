import { Inject, Injectable } from "@nestjs/common";
import type { RoomId, VibeSnapshot } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";

/**
 * Vibe 購読開始時の `Snapshot` ペイロードを組み立てる usecase
 * ルームのメンバー一覧と各メンバーの集約済みステータスを突き合わせて 1 回で返す
 * ルームが見つからなければ `RoomNotFound` を投げる
 */
@Injectable()
export class GetVibeSnapshot {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
  ) {}

  async execute(input: { roomId: RoomId }): Promise<VibeSnapshot> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }

    const statuses = await this.vibes.snapshot(input.roomId);
    return { members: room.members, statuses };
  }
}
