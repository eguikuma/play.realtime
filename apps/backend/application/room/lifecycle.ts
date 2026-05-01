import { Inject, Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { PubSub } from "../shared/ports/pubsub";
import { RoomPresence } from "./presence";

/**
 * ルーム閉鎖時に呼ばれるクリーンアップ関数
 * 各機能のリポジトリ側で登録し、`RoomCleanupRegistrar` が起動時にまとめて差し込む
 */
export type RoomCleanup = (roomId: RoomId) => Promise<void>;

/**
 * ルームの生涯を管理するサービス
 * 最後の接続が切れてから猶予 30 秒の間に再入室がなければ、登録済み全クリーンアップを走らせて PubSub の配信経路も閉じる
 * 猶予期間は再接続やリロードによる一時離脱でルームが即消滅しないためのバッファ
 */
@Injectable()
export class RoomLifecycle {
  private readonly cleanups: RoomCleanup[] = [];
  private readonly graceTimers = new Map<RoomId, NodeJS.Timeout>();
  private graceMs = 30_000;

  constructor(
    @Inject(RoomPresence) private readonly presence: RoomPresence,
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
   * クリーンアップ関数を登録する
   * 閉鎖時に登録順で await 直列実行される
   */
  registerCleanup(cleanup: RoomCleanup): void {
    this.cleanups.push(cleanup);
  }

  /**
   * 既定 30 秒の猶予期間を上書きする
   * テストと `ROOM_GRACE_MS` 環境変数で使う
   */
  overrideGracePeriod(ms: number): void {
    this.graceMs = ms;
  }

  /**
   * 指定ルームを即時閉鎖する
   * 猶予タイマーがあれば取り消し、全クリーンアップを直列実行した後に PubSub の配信経路を閉じる
   * クリーンアップ側の throw は飲み込み、後続のクリーンアップを止めない
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
   * 無人遷移を受けて猶予タイマーを開始する
   * 既存タイマーがあれば差し替える
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
   * 稼働中の猶予タイマーを取り消す
   * 再入室や明示的 destroy からの呼び出しを想定する
   */
  private cancelGrace(roomId: RoomId): void {
    const timer = this.graceTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(roomId);
    }
  }
}
