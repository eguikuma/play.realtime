import { Inject, Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { PubSub } from "../ports/pubsub";
import { RoomPresence } from "./presence";

/**
 * ルーム破棄時に各機能が呼ばれる後片付け関数の型
 * 引数のルーム ID 配下に属するデータを 自分の責任範囲ぶんだけ取り除く
 */
export type RoomCleanup = (roomId: RoomId) => Promise<void>;

/**
 * ルームの生命サイクルを束ねるサービス
 * 最終接続が抜けてから指定の猶予期間を待ち 復帰が無ければ登録済みの全機能の後片付けを順に走らせる
 * 各機能は自分の Repository の `remove(roomId)` を本サービスにコールバックとして登録する (プラグインパターン)
 * 本サービス自体は機能ごとの Repository を知らず 結合を 1 方向に保つ
 */
@Injectable()
export class RoomLifecycle {
  /**
   * 各機能が登録する後片付け関数の集合
   * 登録順に直列で走らせることで 依存関係がある破棄 (例えば Room Entity は最後) を呼び出し側の順序で整える
   */
  private readonly cleanups: RoomCleanup[] = [];
  /**
   * 猶予期間中のタイマーを ルーム ID と対応させて保持する
   * 復帰時のキャンセルと 多重起動防止のため 1 ルーム 1 タイマーに揃える
   */
  private readonly graceTimers = new Map<RoomId, NodeJS.Timeout>();
  /**
   * 猶予期間のミリ秒 既定は 30 秒
   * テストからは `overrideGracePeriod` で短縮する
   */
  private graceMs = 30_000;

  /**
   * 在室遷移サービスと パブリッシュ購読ポートを依存性注入で受け取る
   * 起動時に遷移イベントを購読し 空は猶予を起動 復帰は猶予を打ち切る
   */
  constructor(
    private readonly presence: RoomPresence,
    @Inject(PubSub) private readonly pubsub: PubSub,
  ) {
    this.presence.onTransition((event) => {
      if (event.kind === "empty") {
        this.startGrace(event.roomId);
      } else {
        this.cancelGrace(event.roomId);
      }
    });
  }

  /**
   * 後片付け関数を登録する
   * 各機能のモジュール初期化フックから 自分の Repository の `remove(roomId)` を束ねる形で呼ぶ想定
   */
  registerCleanup(cleanup: RoomCleanup): void {
    this.cleanups.push(cleanup);
  }

  /**
   * 単体テスト向けに猶予期間を短く差し替える
   * 運用コードからは呼ばない
   */
  overrideGracePeriod(ms: number): void {
    this.graceMs = ms;
  }

  /**
   * 登録済みの後片付けを即時に走らせる
   * テストからの直接確認と 将来の明示削除経路で使うための公開口
   */
  async destroy(roomId: RoomId): Promise<void> {
    this.cancelGrace(roomId);
    for (const cleanup of this.cleanups) {
      try {
        await cleanup(roomId);
      } catch {}
    }
    this.pubsub.closeByPrefix(`room:${roomId}:`);
  }

  /**
   * 猶予期間のタイマーを起動する
   * 既存のタイマーがあれば事前に破棄し 多重起動と二重発火を避ける
   */
  private startGrace(roomId: RoomId): void {
    this.cancelGrace(roomId);
    const timer = setTimeout(() => {
      this.graceTimers.delete(roomId);
      void this.destroy(roomId);
    }, this.graceMs);
    this.graceTimers.set(roomId, timer);
  }

  /**
   * 猶予期間のタイマーを取り消す
   * 該当タイマーが無ければ冪等に無視する
   */
  private cancelGrace(roomId: RoomId): void {
    const timer = this.graceTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(roomId);
    }
  }
}
