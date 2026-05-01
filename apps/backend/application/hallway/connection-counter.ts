import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 廊下トークの WebSocket 接続を ルームとメンバーの組で計数するサービス
 * 複数タブでの同時接続を考慮し 「最初の接続」と「最後の切断」だけをユースケースに通知する
 */
@Injectable()
export class HallwayConnectionCounter {
  /**
   * ルームとメンバーの結合した鍵から 現在の接続数へのマップを持つ
   */
  private readonly counts = new Map<string, number>();

  /**
   * 新規接続を 1 本登録する
   * 初回の接続である場合のみ 呼び出し側で参加相当の通知を出す
   */
  attach(roomId: RoomId, memberId: MemberId): { isFirst: boolean } {
    const key = this.key(roomId, memberId);
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return { isFirst: next === 1 };
  }

  /**
   * 接続を 1 本切り離す
   * 最後の接続である場合のみ 呼び出し側で離脱相当の通知を出す
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

  /**
   * マップの鍵を ルーム ID とメンバー ID の結合文字列で組み立てる
   */
  private key(roomId: RoomId, memberId: MemberId): string {
    return `${roomId}:${memberId}`;
  }
}
