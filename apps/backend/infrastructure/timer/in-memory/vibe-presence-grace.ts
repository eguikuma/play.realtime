import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { VibePresenceGrace } from "../../../application/vibe/presence-grace";

/**
 * Vibe 退室通知の猶予期間、このミリ秒内に同じメンバーの再入室が来れば `Left` を送らずに済ませる
 */
const GRACE_MS = 1500;

const keyOf = (roomId: RoomId, memberId: MemberId) => `${roomId}:${memberId}`;

/**
 * `VibePresenceGrace` port の in-memory 実装
 * 単一プロセスの `Map` でルーム × メンバーごとのタイマーを保持し、`schedule` で 1500ms タイマーを張って `cancel` で取り消す
 * 複数 backend 構成では cross-instance 同期されないため、その場合は `infrastructure/timer/redis` 側の実装を使う
 */
@Injectable()
export class InMemoryVibePresenceGrace implements VibePresenceGrace {
  private readonly timers = new Map<string, NodeJS.Timeout>();

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
