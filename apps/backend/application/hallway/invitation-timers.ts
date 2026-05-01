import { Injectable } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";

/**
 * 未応答の招待を自動で失効させるためのタイマー管理サービス
 * 招待を発行するユースケースが登録し 承諾や辞退や取り消しや切断の各経路で取り消される
 */
@Injectable()
export class HallwayInvitationTimers {
  /**
   * 進行中のタイマーを招待 ID で引けるマップを持つ
   */
  private readonly timers = new Map<InvitationId, NodeJS.Timeout>();

  /**
   * 指定した招待の失効タイマーを登録する
   * 指定時間が経過した時点で自動削除を行ってから コールバックを呼ぶ
   */
  register(id: InvitationId, delayMs: number, callback: () => void): void {
    const timeout = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delayMs);
    this.timers.set(id, timeout);
  }

  /**
   * 指定した招待のタイマーを取り消す
   * 対応するタイマーが無い場合は何もしない
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
