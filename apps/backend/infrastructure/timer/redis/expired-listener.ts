import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";

type Handler = (key: string) => void;

/**
 * Redis のキースペース通知 `__keyevent@${db}__:expired` を購読し、prefix で機能ごとに dispatch する専用 service
 * Redis 仕様で SUBSCRIBE 中の client は他コマンドを受け付けないため、`RedisPubSub` の subscriber と混在させずに専用 client を別で持つ
 * 各 Redis timer 実装は constructor で `subscribe(prefix, handler)` を呼び、本クラスの `onModuleInit` で 1 回だけ実 SUBSCRIBE を完了させて受信経路を整える
 */
@Injectable()
export class RedisExpiredListener implements OnModuleInit, OnModuleDestroy {
  private readonly subscriber: Redis;
  private readonly handlers = new Map<string, Handler>();
  private readonly logger = new Logger(RedisExpiredListener.name);

  constructor(redisUrl: string) {
    this.subscriber = new Redis(redisUrl);
    this.subscriber.on("message", (_channel, key) => {
      this.dispatch(key);
    });
  }

  /**
   * prefix と handler の組を dispatch table に購読登録する
   * 実 SUBSCRIBE は `onModuleInit` でまとめて行うため、本メソッドはネットワーク往復を伴わない同期登録で済む
   * 同 prefix を二重購読すると後勝ちで上書きされるため、利用側は機能 1 つにつき 1 prefix を厳守する
   */
  subscribe(prefix: string, handler: Handler): void {
    if (this.handlers.has(prefix)) {
      this.logger.warn(`prefix "${prefix}" is already subscribed, overwriting`);
    }
    this.handlers.set(prefix, handler);
  }

  /**
   * NestJS のライフサイクルで providers 解決後に呼ばれ、keyspace notification チャネルへの SUBSCRIBE をここで完了させる
   * 各 Redis timer 実装の constructor 内 `subscribe` 呼び出しは順序を問わず、実 SUBSCRIBE が確立するまで通知は届かないが、本フックの `await` で確実に確立してから後続の業務処理を受け付ける
   * `__keyevent@${db}__:expired` の `db` は ioredis が URL パース時に正規化した `options.db` に追従し、`/N` 付き REDIS_URL でも適切な channel を選ぶ
   */
  async onModuleInit(): Promise<void> {
    const db = this.subscriber.options.db ?? 0;
    const channel = `__keyevent@${db}__:expired`;
    try {
      await this.subscriber.subscribe(channel);
    } catch (error) {
      this.logger.error(
        `redis SUBSCRIBE failed for "${channel}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * シャットダウンフックで subscriber 接続を閉じ、未解放のままアプリを落とさないようにする
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.subscriber.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  /**
   * 受信した expired key を登録済 prefix で前方一致して、該当 handler に渡す
   * どの prefix にも合致しない key は他機能の購読対象外あるいは done lock の expired なので静かに無視する
   * handler の throw は飲み込み、1 つの handler の失敗が他 prefix の dispatch を止めないようにする
   */
  private dispatch(key: string): void {
    for (const [prefix, handler] of this.handlers) {
      if (!key.startsWith(prefix)) {
        continue;
      }
      try {
        handler(key);
      } catch (error) {
        this.logger.error(
          `expired handler threw for key "${key}"`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      return;
    }
  }
}
