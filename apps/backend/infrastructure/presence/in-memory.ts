import { Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import type {
  PresenceListener,
  PresenceSubscription,
  PresenceTransition,
  RoomPresence,
} from "../../application/room/presence";

/**
 * `RoomPresence` port の in-memory 実装、単一プロセスの `Map` でルーム別の接続数をカウントする
 * `register` で 0→1 へ遷移したら `populated` を、`deregister` で 1→0 へ遷移したら `empty` をリスナー全件に同期配信する
 */
@Injectable()
export class InMemoryRoomPresence implements RoomPresence {
  private readonly counts = new Map<RoomId, number>();

  private readonly listeners = new Set<PresenceListener>();

  register(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    this.counts.set(roomId, before + 1);
    if (before === 0) {
      this.fire(roomId, "populated");
    }
  }

  deregister(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    if (before <= 0) {
      return;
    }
    const after = before - 1;
    if (after === 0) {
      this.counts.delete(roomId);
      this.fire(roomId, "empty");
      return;
    }
    this.counts.set(roomId, after);
  }

  async countConnections(roomId: RoomId): Promise<number> {
    return this.counts.get(roomId) ?? 0;
  }

  onTransition(listener: PresenceListener): PresenceSubscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /**
   * 登録済みリスナー全件に遷移イベントを配信する
   * リスナー内の throw は飲み込み、1 つのリスナーの失敗が他リスナーの呼び出しを止めないようにする
   */
  private fire(roomId: RoomId, kind: PresenceTransition): void {
    for (const listener of [...this.listeners]) {
      try {
        listener({ roomId, kind });
      } catch {}
    }
  }
}
