import { Inject, Injectable } from "@nestjs/common";
import type { HallwaySnapshot, RoomId } from "@play.realtime/contracts";
import { HallwayRepository } from "../../domain/hallway";

/**
 * WebSocket 接続直後に配信する 廊下トークの起動処理を組み立てるユースケース
 * 招待と通話の 2 系列を同時に取得してまとめて返す
 */
@Injectable()
export class GetHallwaySnapshot {
  /**
   * 廊下トークの永続化ポートを依存性注入で受け取る
   */
  constructor(@Inject(HallwayRepository) private readonly hallway: HallwayRepository) {}

  /**
   * 指定ルームの全招待と全通話を同時取得してスナップショットとして返す
   * 受信者本人に関係するものだけへの絞り込みはプレゼンテーション側で行う
   */
  async execute(input: { roomId: RoomId }): Promise<HallwaySnapshot> {
    const [invitations, calls] = await Promise.all([
      this.hallway.findAllInvitationsInRoom(input.roomId),
      this.hallway.findAllCallsInRoom(input.roomId),
    ]);
    return { invitations, calls };
  }
}
