import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * `Left` イベントの遅延発火窓
 * タブ切り替えやリロードによる一瞬の切断で すぐに `Left` を出さないよう猶予を持たせる値
 */
const GRACE_MS = 1500;

/**
 * マップ内部の鍵をルーム ID とメンバー ID の結合文字列で組み立てる
 */
const keyOf = (roomId: RoomId, memberId: MemberId) => `${roomId}:${memberId}`;

/**
 * 空気の `Left` 通知を遅延発火させるサービス
 * 最終接続が切れてから短時間は `Left` を保留し 再接続があれば取り消すことで 瞬断ノイズを吸収する
 */
@Injectable()
export class VibePresenceGrace {
  /**
   * 進行中の `Left` 遅延タイマーのメンバー別マップを持つ
   */
  private readonly timers = new Map<string, NodeJS.Timeout>();

  /**
   * `Left` 通知の遅延発火を登録する
   * 既存のタイマーがある場合は上書きして 最新の要求だけを生かす
   */
  schedule(roomId: RoomId, memberId: MemberId, fire: () => void | Promise<void>): void {
    const key = keyOf(roomId, memberId);
    const existing = this.timers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing);
    }
    const timeout = setTimeout(() => {
      this.timers.delete(key);
      void fire();
    }, GRACE_MS);
    this.timers.set(key, timeout);
  }

  /**
   * 保留中の `Left` 通知を取り消す
   * 取り消しに成功した場合は真を返し 呼び出し側は `Left` の代わりに `Update` を送る判断に使う
   */
  cancel(roomId: RoomId, memberId: MemberId): boolean {
    const key = keyOf(roomId, memberId);
    const timeout = this.timers.get(key);
    if (timeout === undefined) {
      return false;
    }
    clearTimeout(timeout);
    this.timers.delete(key);
    return true;
  }
}
