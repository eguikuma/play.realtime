import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { PubSub } from "../../application/ports/pubsub";
import type {
  PresenceListener,
  PresenceSubscription,
  PresenceTransition,
  RoomPresence,
} from "../../application/room/presence";
import { GlobalTopic } from "../../application/topic";

/**
 * 在室遷移配信時の payload、購読側はルーム ID と遷移種別だけで自分の処理対象を判定できる
 */
type PresencePayload = {
  roomId: RoomId;
  kind: PresenceTransition;
};

/**
 * `RoomPresence` port の Redis 実装、`presence:room:{roomId}:connections` の counter を `INCR`/`DECR` で原子的に増減し、0→1 と 1→0 の遷移を `presence:transition` トピックへ配信する
 * `INCR` の戻り値が 1 なら 0→1、`DECR` の戻り値が 0 なら 1→0 と判定する単発コマンド方式で、Lua / WATCH/MULTI を使わずに原子性を保つ
 * 配信は `PubSub` port 越しに行い、Redis 直叩きを避けて in-memory pubsub への差し替えに将来対応できる構造にする
 * Lifecycle 用の grace timer は本クラスでは持たず、`RoomLifecycle` 側で in-memory タイマーとして管理する
 */
@Injectable()
export class RedisRoomPresence implements RoomPresence, OnModuleDestroy {
  private readonly client: Redis;

  private readonly pubsub: PubSub;

  private readonly listeners = new Set<PresenceListener>();

  private readonly transitionSubscription: { unsubscribe: () => void };

  private readonly logger = new Logger(RedisRoomPresence.name);

  constructor(redisUrl: string, pubsub: PubSub, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
    this.pubsub = pubsub;
    this.transitionSubscription = pubsub.subscribe<PresencePayload>(
      GlobalTopic.PresenceTransition,
      (payload) => {
        this.fan(payload);
      },
    );
  }

  /**
   * 接続数 counter を `INCR` で 1 増やし、戻り値が 1 なら 0→1 遷移とみなして `populated` を pub/sub 経由で配信する
   * 戻り値が 1 でない場合は別接続が既に存在しており、遷移なしとして配信を抑止する
   * 戻り値の Promise は呼び出し側へ返さない fire-and-forget で、Redis 障害時はログのみで他処理を止めない
   */
  register(roomId: RoomId): void {
    this.client.incr(this.key(roomId)).then(
      (after) => {
        if (after === 1) {
          this.publish(roomId, "populated");
        }
      },
      (error: unknown) => {
        this.logger.error(
          `redis INCR failed for room ${roomId}`,
          error instanceof Error ? error.stack : String(error),
        );
      },
    );
  }

  /**
   * 接続数 counter を `DECR` で 1 減らし、戻り値が 0 なら 1→0 遷移とみなして `empty` を pub/sub 経由で配信する
   * 0 になった counter key はその場で `DEL` を別コマンドで投げて掃除する、`DEL` 前に新規 register が来ても新しい遷移は次の `INCR` 戻り値で正しく判定される
   * 戻り値が負なら deregister が register より多く呼ばれた状態で、warn ログを残しつつ counter を `0` に戻して整合を回復する
   */
  deregister(roomId: RoomId): void {
    this.client.decr(this.key(roomId)).then(
      (after) => {
        if (after === 0) {
          this.publish(roomId, "empty");
          this.client.del(this.key(roomId)).catch((error: unknown) => {
            this.logger.error(
              `redis DEL failed for room ${roomId}`,
              error instanceof Error ? error.stack : String(error),
            );
          });
          return;
        }
        if (after < 0) {
          this.logger.warn(
            `redis DECR returned ${after} for room ${roomId}, resetting counter to 0`,
          );
          this.client.set(this.key(roomId), 0).catch((error: unknown) => {
            this.logger.error(
              `redis SET failed for room ${roomId}`,
              error instanceof Error ? error.stack : String(error),
            );
          });
        }
      },
      (error: unknown) => {
        this.logger.error(
          `redis DECR failed for room ${roomId}`,
          error instanceof Error ? error.stack : String(error),
        );
      },
    );
  }

  async countConnections(roomId: RoomId): Promise<number> {
    const raw = await this.client.get(this.key(roomId));
    return raw === null ? 0 : Number(raw);
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
   * シャットダウンフックで Redis 接続を閉じ、購読も解除して未解放のままアプリを落とさないようにする
   */
  async onModuleDestroy(): Promise<void> {
    this.transitionSubscription.unsubscribe();
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  /**
   * 遷移を pub/sub に配信する、配信完了は待たず fire-and-forget で次の処理へ進める
   */
  private publish(roomId: RoomId, kind: PresenceTransition): void {
    this.pubsub
      .publish<PresencePayload>(GlobalTopic.PresenceTransition, { roomId, kind })
      .catch((error: unknown) => {
        this.logger.error(
          `presence transition publish failed for room ${roomId}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  /**
   * pub/sub 経由で受信した遷移を、登録済みリスナー全件に同期配信する
   * リスナー内の throw は飲み込み、1 つのリスナーの失敗が他リスナーの呼び出しを止めないようにする
   */
  private fan(payload: PresencePayload): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(payload);
      } catch {}
    }
  }

  private key(roomId: RoomId): string {
    return `presence:room:${roomId}:connections`;
  }
}
