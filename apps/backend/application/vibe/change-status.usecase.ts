import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

/**
 * あるメンバーの単一接続の空気を変更するユースケース
 * 永続化側で集約された結果のみを ルーム全員に `Update` として配信する
 */
@Injectable()
export class ChangeVibeStatus {
  /**
   * 必要な永続化ポートと SSE ハブを依存性注入で受け取る
   */
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
  ) {}

  /**
   * ルームの検証から始まり 接続単位での状態保存 集約後の配信の順で更新する
   * ルームが存在しなければ `RoomNotFound` を投げる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    connectionId: ConnectionId;
    status: VibeStatus;
  }): Promise<void> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const { aggregated } = await this.vibes.save(
      input.roomId,
      input.memberId,
      input.connectionId,
      input.status,
    );
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
