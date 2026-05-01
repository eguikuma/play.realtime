import { Inject, Injectable } from "@nestjs/common";
import { PubSub } from "../../../application/ports/pubsub";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";

type Envelope = {
  name: string;
  data: unknown;
  id?: string;
};

@Injectable()
export class SseHub {
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: SseHeartbeat,
  ) {}

  attach(
    connection: SseConnection,
    options: {
      topic: string;
      onAttach?: (connection: SseConnection) => void | Promise<void>;
    },
  ): void {
    connection.open();

    const stopHeartbeat = this.heartbeat.start(connection);
    const subscription = this.pubsub.subscribe<Envelope>(options.topic, (envelope) => {
      connection.emit(envelope.name, envelope.data, envelope.id);
    });

    connection.onClose(() => {
      subscription.unsubscribe();
      stopHeartbeat();
    });

    void options.onAttach?.(connection);
  }

  async broadcast<T>(topic: string, name: string, data: T, id?: string): Promise<void> {
    const envelope: Envelope = { name, data, ...(id !== undefined ? { id } : {}) };
    await this.pubsub.publish(topic, envelope);
  }
}
