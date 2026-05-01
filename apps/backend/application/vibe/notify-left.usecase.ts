import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { VibeBroadcaster } from "./broadcaster";
import { VibePresenceGrace } from "./presence-grace";

/**
 * SSE 接続切断時に呼ばれ、接続単位の Vibe を削除してから他メンバーへ通知する usecase
 * 最後の接続が切れた場合のみ猶予タイマーを張って `Left` を遅らせ、その間に再入室があれば `Left` を送らない
 */
@Injectable()
export class NotifyVibeLeft {
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly broadcaster: VibeBroadcaster,
    private readonly grace: VibePresenceGrace,
  ) {}

  /**
   * 接続 1 本を削除し、そのメンバー最後の接続だった、または集約結果が `null` になったら `VibePresenceGrace` に登録して猶予後に `Left` を配信する
   * まだ別接続が残っている場合は集約後の値で `Updated` を即時配信する
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
        await this.broadcaster.left(input.roomId, {
          memberId: input.memberId,
        });
      });
      return;
    }
    await this.broadcaster.updated(input.roomId, {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
