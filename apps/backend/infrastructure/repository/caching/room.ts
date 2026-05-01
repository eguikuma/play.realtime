import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import { PubSub, type Subscription } from "../../../application/shared/ports/pubsub";
import { GlobalTopic } from "../../../application/shared/topic";
import type { RoomRepository } from "../../../domain/room";

/**
 * `RoomCacheInvalidate` topic で配信されるペイロード型
 * 購読側は `roomId` だけを受け取り、自インスタンスの cache から該当エントリを取り除く
 */
type RoomCacheInvalidatePayload = { roomId: RoomId };

/**
 * `RoomRepository` を decorate して `Room` 取得結果をプロセス内 `Map` に cache する実装
 * realtime ホットパスの `vibe change-status` や `bgm set` などが毎操作ごとに発行する `GET room:{id}` を hit に置換するのが狙い
 * `save` と `remove` のあとは自分の cache を捨ててから `RoomCacheInvalidate` を配信し、複数インスタンス間で同じ無効化を行う
 * 受信ハンドラは publisher を区別せず常に `cache.delete` を行うため、自分が出した invalidate も自分で消化することになる
 */
@Injectable()
export class CachingRoomRepository implements RoomRepository, OnModuleInit, OnModuleDestroy {
  private readonly cache = new Map<RoomId, Room>();
  private readonly logger = new Logger(CachingRoomRepository.name);
  private subscription: Subscription | null = null;

  constructor(
    private readonly inner: RoomRepository,
    @Inject(PubSub) private readonly pubsub: PubSub,
  ) {}

  /**
   * cache hit なら即返却、miss なら `inner.find` を 1 回呼び結果が `null` でない時だけ cache に載せる
   * `null` は cache しない、存在しないルームへの問い合わせは稀でわざわざ negative cache を持つ動機が薄い
   */
  async find(id: RoomId): Promise<Room | null> {
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    const room = await this.inner.find(id);
    if (room) {
      this.cache.set(id, room);
    }
    return room;
  }

  /**
   * 永続化を済ませてから自分の cache を捨て、最後に他インスタンスへ無効化を配信する
   * cache を `set` ではなく `delete` で統一することで、自分の publish を自分が受けて即座に消す自己レースを避ける
   * 次回 `find` で 1 度だけ `inner.find` が走り、その時点の最新値が cache に再登録される
   */
  async save(room: Room): Promise<void> {
    await this.inner.save(room);
    this.cache.delete(room.id);
    await this.broadcastInvalidation(room.id);
  }

  /**
   * 永続化からの削除を済ませてから自分の cache を捨て、最後に他インスタンスへ無効化を配信する
   * `RoomLifecycle.destroy` 経由でこの経路に到達するため、ルーム閉鎖時に全インスタンスの cache が同期して空になる
   */
  async remove(id: RoomId): Promise<void> {
    await this.inner.remove(id);
    this.cache.delete(id);
    await this.broadcastInvalidation(id);
  }

  /**
   * `RoomCacheInvalidate` topic を購読し、受信ペイロードの `roomId` を自分の cache から取り除く
   * モジュール初期化時に 1 度だけ走る
   * 購読解除は `onModuleDestroy` に任せる
   */
  onModuleInit(): void {
    this.subscription = this.pubsub.subscribe<RoomCacheInvalidatePayload>(
      GlobalTopic.RoomCacheInvalidate,
      (payload) => {
        this.cache.delete(payload.roomId);
      },
    );
  }

  /**
   * 購読を解除し、inner が `OnModuleDestroy` を持つなら一緒に終了させる
   * Nest は decorator 側のフックしか呼ばないため、inner の Redis クライアントなど内部資源を確実に閉じるためのフォワード経路にしている
   */
  async onModuleDestroy(): Promise<void> {
    this.subscription?.unsubscribe();
    this.subscription = null;

    const destroyable = this.inner as Partial<OnModuleDestroy>;
    if (typeof destroyable.onModuleDestroy === "function") {
      await destroyable.onModuleDestroy();
    }
  }

  /**
   * `RoomCacheInvalidate` を配信する
   * 配信失敗時は warn ログだけ残し例外は飲み込む
   * `save` や `remove` 自体は永続化に成功している前提で、配信失敗で全体を失敗扱いにすると一貫性がかえって悪くなるため
   */
  private async broadcastInvalidation(roomId: RoomId): Promise<void> {
    try {
      await this.pubsub.publish<RoomCacheInvalidatePayload>(GlobalTopic.RoomCacheInvalidate, {
        roomId,
      });
    } catch (error) {
      this.logger.warn(
        `RoomCacheInvalidate の配信に失敗した roomId=${roomId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
