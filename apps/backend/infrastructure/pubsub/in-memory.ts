import { Injectable, Logger } from "@nestjs/common";
import { PubSub, type Subscription } from "../../application/ports/pubsub";

type Handler = (payload: unknown) => void;

/**
 * `PubSub` port の in-memory 実装、単一プロセスで動く学習用途の既定配信経路
 * 将来 Redis pub/sub に差し替える場合はこの Provider を `useClass` で入れ替えるだけで済むように API を合わせている
 */
@Injectable()
export class InMemoryPubSub implements PubSub {
  private readonly subscribers = new Map<string, Set<Handler>>();

  private readonly logger = new Logger(InMemoryPubSub.name);

  /**
   * 購読者集合を配信時点でスナップショットしてから `queueMicrotask` で個別に呼び出す
   * 同期ループ中に別 handler が `subscribe` / `unsubscribe` を呼んでも反復が壊れず、handler 内の throw も他購読者の配信を止めない
   */
  async publish<T>(topic: string, payload: T): Promise<void> {
    const handlers = this.subscribers.get(topic);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const snapshot = Array.from(handlers);
    for (const handler of snapshot) {
      queueMicrotask(() => {
        try {
          handler(payload);
        } catch (error) {
          this.logger.error(
            `subscriber handler threw on topic "${topic}"`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      });
    }
  }

  /**
   * 指定トピックを購読する、戻り値の `unsubscribe` で解除する
   * 解除時に購読者集合が空になればマップ自体も削除して、古いトピックの残骸を残さないようにする
   */
  subscribe<T>(topic: string, handler: (payload: T) => void): Subscription {
    const handlers = this.subscribers.get(topic) ?? new Set<Handler>();
    const typed = handler as Handler;
    handlers.add(typed);
    this.subscribers.set(topic, handlers);

    return {
      unsubscribe: () => {
        const current = this.subscribers.get(topic);
        if (!current) {
          return;
        }
        current.delete(typed);
        if (current.size === 0) {
          this.subscribers.delete(topic);
        }
      },
    };
  }

  /**
   * 指定プレフィックスで始まる全トピックの購読を打ち切る、ルーム閉鎖時の `room:{roomId}:` 掃除で使う
   */
  closeByPrefix(prefix: string): void {
    for (const topic of [...this.subscribers.keys()]) {
      if (topic.startsWith(prefix)) {
        this.subscribers.delete(topic);
      }
    }
  }
}
