import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 廊下トーク WebSocket の接続数をルームとメンバーの単位でカウントするサービス
 * 複数タブ接続の初回接続と最終接続の遷移だけを検知して、`HandleHallwayDisconnect` の発火を最後の接続切断に限定する
 */
@Injectable()
export class HallwayConnectionCounter {
  private readonly counts = new Map<string, number>();

  /**
   * 接続を 1 本追加し、そのメンバー初の接続かを `isFirst` で返す
   */
  attach(roomId: RoomId, memberId: MemberId): { isFirst: boolean } {
    const key = this.key(roomId, memberId);
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return { isFirst: next === 1 };
  }

  /**
   * 接続を 1 本減らし、そのメンバー最後の接続が切れたかを `isLast` で返す
   * `isLast` が `true` のときだけ呼び出し側は `HandleHallwayDisconnect` を実行して、招待と通話の掃除を走らせる
   */
  detach(roomId: RoomId, memberId: MemberId): { isLast: boolean } {
    const key = this.key(roomId, memberId);
    const current = this.counts.get(key) ?? 0;
    const next = current - 1;
    if (next <= 0) {
      this.counts.delete(key);
      return { isLast: true };
    }
    this.counts.set(key, next);
    return { isLast: false };
  }

  private key(roomId: RoomId, memberId: MemberId): string {
    return `${roomId}:${memberId}`;
  }
}
