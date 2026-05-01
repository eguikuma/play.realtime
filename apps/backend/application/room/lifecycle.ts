import { Inject, Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { PubSub } from "../shared/ports/pubsub";
import { RoomLifecycleGrace } from "./lifecycle-grace";
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
 * 猶予タイマー本体は `RoomLifecycleGrace` port に委譲し、複数 backend 構成では Redis 実装に倒して cross-instance で 1 backend のみが destroy を実行する
 */
@Injectable()
export class RoomLifecycle {
  private readonly cleanups: RoomCleanup[] = [];

  constructor(
    @Inject(RoomPresence) private readonly presence: RoomPresence,
    @Inject(PubSub) private readonly pubsub: PubSub,
    @Inject(RoomLifecycleGrace) private readonly grace: RoomLifecycleGrace,
  ) {
    this.presence.onTransition((event) => {
      if (event.kind === "empty") {
        this.grace.schedule(event.roomId, () => this.destroy(event.roomId));
      } else {
        this.grace.cancel(event.roomId);
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
    this.grace.override(ms);
  }

  /**
   * 指定ルームを即時閉鎖する
   * 猶予タイマーがあれば取り消し、全クリーンアップを直列実行した後に PubSub の配信経路を閉じる
   * クリーンアップ側の throw は飲み込み、後続のクリーンアップを止めない
   */
  async destroy(roomId: RoomId): Promise<void> {
    this.grace.cancel(roomId);

    for (const cleanup of this.cleanups) {
      try {
        await cleanup(roomId);
      } catch {}
    }

    this.pubsub.closeByPrefix(`room:${roomId}:`);
  }
}
