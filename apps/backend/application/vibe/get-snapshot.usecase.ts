import { Inject, Injectable } from "@nestjs/common";
import type { RoomId, VibeSnapshot } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";

/**
 * SSE の購読開始時の起動処理として ルームの全参加メンバーと現在の空気を返すユースケース
 * メンバー一覧はルーム台帳から取得し 空気一覧は集約後の値として取得する
 */
@Injectable()
export class GetVibeSnapshot {
  /**
   * ルームと空気の 2 つの永続化ポートを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
  ) {}

  /**
   * ルームの検証を経たうえで 全参加メンバーと空気のスナップショットを返す
   * ルームが無ければ `RoomNotFound` を投げる
   */
  async execute(input: { roomId: RoomId }): Promise<VibeSnapshot> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const statuses = await this.vibes.snapshot(input.roomId);
    return { members: room.members, statuses };
  }
}
