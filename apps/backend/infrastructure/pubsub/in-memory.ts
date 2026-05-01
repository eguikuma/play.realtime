import { Injectable, Logger } from "@nestjs/common";
import { PubSub, type Subscription } from "../../application/ports/pubsub";

/**
 * トピック購読者 1 件ぶんの非同期ハンドラ
 */
type Handler = (payload: unknown) => void;

/**
 * 単一プロセス内で動作する仮置きのパブリッシュ購読実装
 * トピックごとにハンドラの集合を持ち 配信はマイクロタスクで非同期化する
 * Redis のパブリッシュ購読などへ差し替える際は パブリッシュ購読ポートを再実装する
 */
@Injectable()
export class InMemoryPubSub implements PubSub {
  /**
   * トピック名から購読ハンドラ群へのマップを持つ
   */
  private readonly subscribers = new Map<string, Set<Handler>>();
  /**
   * ハンドラから投げられた例外を記録する NestJS のロガー
   */
  private readonly logger = new Logger(InMemoryPubSub.name);

  /**
   * 指定トピックにペイロードを配信する
   * あるハンドラの例外が 他のハンドラの実行を止めないようマイクロタスクで隔離する
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
   * 指定トピックに購読ハンドラを登録する
   * 返す購読ハンドルの解除は冪等であり 空集合になったトピック行も後片付けする
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
}
