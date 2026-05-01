import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { VibePresenceGrace } from "./presence-grace";
import { topic } from "./topic";

/**
 * 接続が切れたときに `Left` の遅延発火か `Update` を配信するユースケース
 * 最終接続が切れた場合のみ猶予経由で `Left` を予約し それ以外は即時に集約結果を `Update` で流す
 */
@Injectable()
export class NotifyVibeLeft {
  /**
   * 空気のポートと SSE ハブ そして在室猶予サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
    private readonly grace: VibePresenceGrace,
  ) {}

  /**
   * 接続削除 最終接続判定 `Left` 予約か `Update` 配信への分岐を進める
   * 予約された `Left` は猶予時間内の再接続があれば取り消されうる
   */
  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    connectionId: ConnectionId;
  }): Promise<void> {
    const { isLast, aggregated } = await this.vibes.delete(
      input.roomId,
      input.memberId,
      input.connectionId,
    );
    if (isLast || aggregated === null) {
      this.grace.schedule(input.roomId, input.memberId, async () => {
        await this.hub.broadcast(topic(input.roomId), "Left", {
          memberId: input.memberId,
        });
      });
      return;
    }
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
