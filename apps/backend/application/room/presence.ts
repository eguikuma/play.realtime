import { Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";

/**
 * ルームの在室有無が切り替わった遷移の種類
 * `empty` は最後の接続が切れて無人になった瞬間、`populated` は無人から再度在室した瞬間を表す
 */
export type PresenceTransition = "empty" | "populated";

/**
 * ルームの在室遷移を受け取るリスナー関数、`RoomLifecycle` が主要な購読者として登録する
 */
export type PresenceListener = (event: { roomId: RoomId; kind: PresenceTransition }) => void;

/**
 * `onTransition` の戻り値、`unsubscribe` を呼ぶと当該リスナーへの配信が止まる
 */
export type PresenceSubscription = {
  unsubscribe: () => void;
};

/**
 * ルームごとの現在接続数をカウントして、`empty` と `populated` の遷移をリスナーへ通知するサービス
 * 接続遷移の検出は SSE と WebSocket の両方の transport 層から `register` と `deregister` で呼ばれる
 */
@Injectable()
export class RoomPresence {
  private readonly counts = new Map<RoomId, number>();

  private readonly listeners = new Set<PresenceListener>();

  /**
   * 新しい接続を記録し、無人からの復帰ならリスナーへ `populated` を配信する
   */
  register(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    this.counts.set(roomId, before + 1);
    if (before === 0) {
      this.fire(roomId, "populated");
    }
  }

  /**
   * 接続を 1 本減らし、最後の接続が切れたらリスナーへ `empty` を配信する
   * 既に 0 以下のカウンタには触らず、二重解除を無視する
   */
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

  /**
   * 現在のルーム接続数を取得する、テストと診断用途が主
   */
  countConnections(roomId: RoomId): number {
    return this.counts.get(roomId) ?? 0;
  }

  /**
   * 在室遷移リスナーを登録する、戻り値の `unsubscribe` で解除する
   */
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
