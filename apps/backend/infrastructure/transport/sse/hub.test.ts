import type { MurmurTopic } from "@play.realtime/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PubSub, Subscription } from "../../../application/ports/pubsub";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";
import { SseHub } from "./hub";

const testTopic = "room:abc:murmur" as MurmurTopic;

type Handler = (payload: unknown) => void;

const buildPubSub = () => {
  const subscribers = new Map<string, Handler[]>();
  const pubsub: PubSub = {
    publish: vi.fn(async (topic, payload) => {
      for (const handler of subscribers.get(topic) ?? []) {
        handler(payload);
      }
    }),
    subscribe: vi.fn((topic, handler): Subscription => {
      const list = subscribers.get(topic) ?? [];
      list.push(handler as Handler);
      subscribers.set(topic, list);
      return {
        unsubscribe: vi.fn(() => {
          const current = subscribers.get(topic) ?? [];
          subscribers.set(
            topic,
            current.filter((entry) => entry !== handler),
          );
        }),
      };
    }),
    closeByPrefix: vi.fn(),
  };
  return { pubsub, subscribers };
};

const buildConnection = () => {
  const closeHandlers: Array<() => void> = [];
  const connection = {
    open: vi.fn(),
    emit: vi.fn(),
    comment: vi.fn(),
    close: vi.fn(),
    onClose: vi.fn((callback: () => void) => {
      closeHandlers.push(callback);
    }),
  } as unknown as SseConnection;

  const fireClose = () => {
    for (const handler of closeHandlers) {
      handler();
    }
  };

  return { connection, fireClose };
};

const buildHeartbeat = (stop: () => void = () => {}) => {
  const heartbeat = new SseHeartbeat();
  vi.spyOn(heartbeat, "start").mockReturnValue(stop);
  return heartbeat;
};

describe("SseHub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("接続を紐付けるとストリームを開きトピックの購読を開始する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();

    hub.attach(connection, { topic: testTopic });

    expect(connection.open).toHaveBeenCalledOnce();
    expect(subscribers.get(testTopic)?.length).toBe(1);
  });

  it("クライアントが切断すると購読とハートビートを自動で解除する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const stopHeartbeat = vi.fn();
    const hub = new SseHub(pubsub, buildHeartbeat(stopHeartbeat));
    const { connection, fireClose } = buildConnection();

    hub.attach(connection, { topic: testTopic });
    fireClose();

    expect(subscribers.get(testTopic)?.length).toBe(0);
    expect(stopHeartbeat).toHaveBeenCalledOnce();
  });

  it("ブロードキャストは封筒形式で配信する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());

    await hub.broadcast(testTopic, "posted", { text: "hi" }, "murmur-1");

    expect(pubsub.publish).toHaveBeenCalledWith(testTopic, {
      name: "posted",
      data: { text: "hi" },
      id: "murmur-1",
    });
  });

  it("接続時の初期処理 callback を実行する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();
    const onAttach = vi.fn();

    hub.attach(connection, { topic: testTopic, onAttach });
    await new Promise((resolve) => setImmediate(resolve));

    expect(onAttach).toHaveBeenCalledWith(connection);
  });
});
