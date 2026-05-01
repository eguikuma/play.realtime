import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { PubSub, type Subscription } from "../../application/shared/ports/pubsub";

type Handler = (payload: unknown) => void;

/**
 * `PubSub` port の Redis 実装、Redis pub/sub 経由で複数インスタンス間の配信を成立させる
 * Redis 仕様で subscribe 中の client は他コマンドを受け付けないため、配信用と購読用の 2 client を分けて保持する
 * port 自体は `subscribe` を同期 API にしているが、Redis の `SUBSCRIBE` はネットワーク往復で完了するため、購読直後に到達したメッセージは受信できない可能性がある (購読登録は接続時 1 回かつ配信は人間操作起点なので実用上は問題にならない)
 */
@Injectable()
export class RedisPubSub implements PubSub, OnModuleDestroy {
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly subscribers = new Map<string, Set<Handler>>();
  private readonly logger = new Logger(RedisPubSub.name);

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on("message", (topic, raw) => {
      this.fanOut(topic, raw);
    });
  }

  /**
   * Redis に payload を JSON 化して配信する
   * 購読者がいなければ Redis 側で破棄される
   * publish 自体の Promise は配信完了ではなくコマンド送出の完了で resolve するため、戻り値の `await` は配信到達保証ではない
   */
  async publish<T>(topic: string, payload: T): Promise<void> {
    await this.publisher.publish(topic, JSON.stringify(payload));
  }

  /**
   * 指定トピックを購読する
   * 戻り値の `unsubscribe` で解除する
   * 内部 dispatch table に handler を追加し、当該トピック初の購読のときだけ Redis 側に `SUBSCRIBE` コマンドを送る
   * 解除時に handler 集合が空になれば Redis 側にも `UNSUBSCRIBE` を送って受信経路を畳む
   */
  subscribe<T>(topic: string, handler: (payload: T) => void): Subscription {
    const isFirstHandler = !this.subscribers.has(topic);
    const handlers = this.subscribers.get(topic) ?? new Set<Handler>();
    const typed = handler as Handler;
    handlers.add(typed);
    this.subscribers.set(topic, handlers);

    if (isFirstHandler) {
      void this.subscriber.subscribe(topic).catch((error: unknown) => {
        this.logger.error(
          `redis SUBSCRIBE failed for topic "${topic}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }

    return {
      unsubscribe: () => {
        const current = this.subscribers.get(topic);
        if (!current) {
          return;
        }

        current.delete(typed);
        if (current.size === 0) {
          this.subscribers.delete(topic);
          void this.subscriber.unsubscribe(topic).catch((error: unknown) => {
            this.logger.error(
              `redis UNSUBSCRIBE failed for topic "${topic}"`,
              error instanceof Error ? error.stack : String(error),
            );
          });
        }
      },
    };
  }

  /**
   * 指定プレフィックスで始まる全トピックの購読を打ち切る
   * ルーム閉鎖時の `room:{roomId}:` 掃除で使う
   * 内部 dispatch table から該当 handler を消した後、Redis 側にも `UNSUBSCRIBE` を一括で送って受信経路ごと畳む
   */
  closeByPrefix(prefix: string): void {
    const matched: string[] = [];
    for (const topic of this.subscribers.keys()) {
      if (topic.startsWith(prefix)) {
        matched.push(topic);
      }
    }
    for (const topic of matched) {
      this.subscribers.delete(topic);
    }

    if (matched.length > 0) {
      void this.subscriber.unsubscribe(...matched).catch((error: unknown) => {
        this.logger.error(
          `redis UNSUBSCRIBE failed for prefix "${prefix}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }
  }

  /**
   * NestJS のシャットダウンフックで Redis 接続を閉じる
   * 起動済みコネクションを未解放のまま落とさないようにする
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
  }

  /**
   * Redis から届いた raw メッセージを JSON parse して、登録済み handler 全件にスナップショット越しで配信する
   * handler 内で `subscribe` や `unsubscribe` が呼ばれても反復が壊れないようにスナップショットを取り、handler の throw は飲み込んで他購読者の配信を止めない
   */
  private fanOut(topic: string, raw: string): void {
    const handlers = this.subscribers.get(topic);
    if (!handlers || handlers.size === 0) {
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      this.logger.error(
        `failed to parse redis message on topic "${topic}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return;
    }

    const snapshot = Array.from(handlers);
    for (const handler of snapshot) {
      try {
        handler(payload);
      } catch (error) {
        this.logger.error(
          `subscriber handler threw on topic "${topic}"`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
