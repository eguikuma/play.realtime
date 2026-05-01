import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * Vibe 退室通知の猶予期間、このミリ秒内に同じメンバーの再入室が来れば `Left` を送らずに済ませる
 */
const GRACE_MS = 1500;

const keyOf = (roomId: RoomId, memberId: MemberId) => `${roomId}:${memberId}`;

/**
 * Vibe 退室通知の猶予タイマーを保持するサービス
 * ブラウザリロードや瞬間的な通信途絶では SSE 接続の切断と再接続がほぼ同時に起きるため、即 `Left` 配信すると他メンバーの画面が点滅する
 * そこで退室検知時は 1500ms のタイマーを張り、同メンバーの再入室で `cancel` されれば `Left` を送らないようにする
 */
@Injectable()
export class VibePresenceGrace {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  /**
   * 指定メンバー宛の猶予タイマーを張る、同メンバーの既存タイマーがあれば差し替える
   * 時間経過で `fire` が呼ばれ、呼ばれた側で `Left` 配信などの確定処理を行う
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
   * 指定メンバーの稼働中タイマーを取り消す、取り消せたかどうかを `boolean` で返す
   * 戻り値が `true` のとき、呼び出し側は「再入室だったので `Joined` ではなく `Updated` を配信する」判断に使える
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
