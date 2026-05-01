import { Inject, Injectable } from "@nestjs/common";
import { PubSub } from "../../../application/ports/pubsub";
import type { WsConnection } from "./connection";
import { WsHeartbeat } from "./heartbeat";

type Envelope = {
  name: string;
  data: unknown;
};

@Injectable()
export class WsHub {
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: WsHeartbeat,
  ) {}

  attach(
    connection: WsConnection,
    options: {
      topic: string;
      onAttach?: (connection: WsConnection) => void | Promise<void>;
      onMessage?: (connection: WsConnection, envelope: Envelope) => void | Promise<void>;
    },
  ): void {
    const { stop: stopHeartbeat, onPong } = this.heartbeat.start(connection);

    const subscription = this.pubsub.subscribe<Envelope>(options.topic, (envelope) => {
      connection.send(envelope.name, envelope.data);
    });

    connection.onMessage((raw) => {
      const envelope = parse(raw);
      if (!envelope) {
        return;
      }
      if (envelope.name === "Pong") {
        onPong();
        return;
      }
      void options.onMessage?.(connection, envelope);
    });

    connection.onClose(() => {
      subscription.unsubscribe();
      stopHeartbeat();
    });

    void options.onAttach?.(connection);
  }

  async broadcast<T>(topic: string, name: string, data: T): Promise<void> {
    const envelope: Envelope = { name, data };
    await this.pubsub.publish(topic, envelope);
  }
}

const parse = (raw: string): Envelope | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("name" in parsed) ||
      typeof (parsed as { name: unknown }).name !== "string"
    ) {
      return null;
    }
    const value = parsed as { name: string; data?: unknown };
    return { name: value.name, data: value.data };
  } catch {
    return null;
  }
};
