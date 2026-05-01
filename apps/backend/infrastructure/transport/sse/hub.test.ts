import type { MemberId, MurmurTopic, RoomId } from "@play.realtime/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PubSub, Subscription } from "../../../application/shared/ports/pubsub";
import { GlobalTopic } from "../../../application/shared/topic";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";
import { SseHub } from "./hub";

const testTopic = "room:abc:murmur" as MurmurTopic;
const testRoomId = "test-room-1" as RoomId;
const testMemberId = "test-member-1" as MemberId;

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

const buildConnection = (roomId: RoomId = testRoomId, memberId: MemberId = testMemberId) => {
  const closeHandlers: Array<() => void> = [];
  const connection = {
    roomId,
    memberId,
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

  it("接続時の初期処理コールバックを実行する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();
    const onAttach = vi.fn();

    hub.attach(connection, { topic: testTopic, onAttach });
    await new Promise((resolve) => setImmediate(resolve));

    expect(onAttach).toHaveBeenCalledWith(connection);
  });

  it("起動時に `member-leave` トピックを購読する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());

    hub.onModuleInit();

    expect(subscribers.get(GlobalTopic.MemberLeft)?.length).toBe(1);
  });

  it("`closeByMember` は同一 `roomId` と `memberId` の接続だけを閉じる", () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const target = buildConnection(testRoomId, testMemberId);
    const otherMember = buildConnection(testRoomId, "another-member" as MemberId);
    const otherRoom = buildConnection("another-room" as RoomId, testMemberId);

    hub.attach(target.connection, { topic: testTopic });
    hub.attach(otherMember.connection, { topic: testTopic });
    hub.attach(otherRoom.connection, { topic: testTopic });

    hub.closeByMember(testRoomId, testMemberId);

    expect(target.connection.close).toHaveBeenCalledOnce();
    expect(otherMember.connection.close).not.toHaveBeenCalled();
    expect(otherRoom.connection.close).not.toHaveBeenCalled();
  });

  it("`member-leave` 配信を受けると同一メンバーの接続を閉じる", () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection(testRoomId, testMemberId);

    hub.onModuleInit();
    hub.attach(connection, { topic: testTopic });
    void pubsub.publish(GlobalTopic.MemberLeft, { roomId: testRoomId, memberId: testMemberId });

    expect(connection.close).toHaveBeenCalledOnce();
  });

  it("`member-leave` のペイロードが不正なら何もしない", () => {
    const { pubsub } = buildPubSub();
    const hub = new SseHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection(testRoomId, testMemberId);

    hub.onModuleInit();
    hub.attach(connection, { topic: testTopic });
    void pubsub.publish(GlobalTopic.MemberLeft, { broken: "payload" });

    expect(connection.close).not.toHaveBeenCalled();
  });
});
