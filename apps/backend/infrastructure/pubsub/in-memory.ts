import { Injectable, Logger } from "@nestjs/common";
import { PubSub, type Subscription } from "../../application/ports/pubsub";

type Handler = (payload: unknown) => void;

@Injectable()
export class InMemoryPubSub implements PubSub {
  private readonly subscribers = new Map<string, Set<Handler>>();

  private readonly logger = new Logger(InMemoryPubSub.name);

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

  closeByPrefix(prefix: string): void {
    for (const topic of [...this.subscribers.keys()]) {
      if (topic.startsWith(prefix)) {
        this.subscribers.delete(topic);
      }
    }
  }
}
