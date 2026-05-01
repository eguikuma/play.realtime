import { Injectable } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";

/**
 * 招待の自動失効タイマーを ID 別に保持するサービス
 * `InviteHallway` が 10 秒後の失効コールバックを登録し、`Accept`、`Decline`、`Cancel`、WebSocket 接続切断のいずれかで `cancel` されて発火前に停止する
 */
@Injectable()
export class HallwayInvitationTimers {
  private readonly timers = new Map<InvitationId, NodeJS.Timeout>();

  /**
   * 失効タイマーを登録する、経過後にコールバックが呼ばれ、マップからも自動で削除される
   */
  register(id: InvitationId, delayMs: number, callback: () => void): void {
    const timeout = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delayMs);
    this.timers.set(id, timeout);
  }

  /**
   * 稼働中のタイマーを取り消す、既に発火済み、または未登録の場合は何もしない
   */
  cancel(id: InvitationId): void {
    const timeout = this.timers.get(id);
    if (timeout === undefined) {
      return;
    }
    clearTimeout(timeout);
    this.timers.delete(id);
  }
}
