import { Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";

/**
 * 在室遷移イベントの種別
 * 空から 1 本への昇りか 1 本から空への降りかを購読者が判別するために持たせる
 */
export type PresenceTransition = "empty" | "populated";

/**
 * 在室遷移イベントが 1 件ぶん届いたときに呼ばれるコールバック
 */
export type PresenceListener = (event: { roomId: RoomId; kind: PresenceTransition }) => void;

/**
 * 購読の結果として受け取る操作ハンドル
 * 解除は何度呼んでも副作用を起こさない
 */
export type PresenceSubscription = {
  unsubscribe: () => void;
};

/**
 * ルーム単位の接続数を集計し 空から人が入ったときと 最後の 1 本が抜けたときだけを購読者に知らせるサービス
 * 4 つの通信路 (空気 BGM ひとこと 廊下トーク) の接続ライフサイクルから呼び出され ルーム生命サイクル判定の単一の根拠となる
 * 複数タブ複数機能の同時接続を考慮し 生データはルーム単位の総接続数に揃える
 */
@Injectable()
export class RoomPresence {
  /**
   * ルーム ID を鍵として 現在の総接続数を持つ台帳
   */
  private readonly counts = new Map<RoomId, number>();
  /**
   * 登録された全リスナーの集合 配信は同期で行う
   */
  private readonly listeners = new Set<PresenceListener>();

  /**
   * 新規接続を 1 本登録する
   * 0 から 1 への昇りだったときだけ populated イベントを配信する
   */
  register(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    this.counts.set(roomId, before + 1);
    if (before === 0) {
      this.fire(roomId, "populated");
    }
  }

  /**
   * 接続を 1 本切り離す
   * 1 から 0 への降りだったときだけ empty イベントを配信する
   * 既に 0 の場合は冪等に無視する
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
   * 指定ルームの現在の総接続数を返す
   */
  countConnections(roomId: RoomId): number {
    return this.counts.get(roomId) ?? 0;
  }

  /**
   * 在室遷移イベントの購読ハンドラを登録する
   * 解除ハンドルは冪等であり 複数回呼んでも副作用を起こさない
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
   * 登録済みの全リスナーへイベントを配信する
   * あるリスナーの例外が 他のリスナーの実行を止めないよう例外は握りつぶす
   */
  private fire(roomId: RoomId, kind: PresenceTransition): void {
    for (const listener of [...this.listeners]) {
      try {
        listener({ roomId, kind });
      } catch {}
    }
  }
}
