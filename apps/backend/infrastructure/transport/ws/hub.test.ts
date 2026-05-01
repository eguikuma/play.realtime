import type { HallwayTopic, MemberId, RoomId } from "@play.realtime/contracts";
import { WsCloseCode } from "@play.realtime/transport-protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PubSub, Subscription } from "../../../application/shared/ports/pubsub";
import { GlobalTopic } from "../../../application/shared/topic";
import type { WsConnection } from "./connection";
import { WsHeartbeat } from "./heartbeat";
import { WsHub } from "./hub";

const testTopic = "room:abc:hallway" as HallwayTopic;
const testRoomId = "test-room-1" as RoomId;
const testMemberId = "test-member-1" as MemberId;

type Handler = (payload: unknown) => void;
type MessageHandler = (raw: string) => void;

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
  const messageHandlers: MessageHandler[] = [];
  const connection = {
    roomId,
    memberId,
    send: vi.fn(),
    close: vi.fn(),
    onMessage: vi.fn((handler: MessageHandler) => {
      messageHandlers.push(handler);
    }),
    onClose: vi.fn((callback: () => void) => {
      closeHandlers.push(callback);
    }),
  } as unknown as WsConnection;

  const fireClose = () => {
    for (const handler of closeHandlers) {
      handler();
    }
  };
  const fireMessage = (raw: string) => {
    for (const handler of messageHandlers) {
      handler(raw);
    }
  };

  return { connection, fireClose, fireMessage };
};

const buildHeartbeat = (stop: () => void = () => {}, onPong: () => void = () => {}) => {
  const heartbeat = new WsHeartbeat();
  vi.spyOn(heartbeat, "start").mockReturnValue({ stop, onPong });
  return heartbeat;
};

describe("WsHub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("接続を紐付けるとハートビートを開始しトピックを購読する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();

    hub.attach(connection, { topics: [testTopic] });

    expect(subscribers.get(testTopic)?.length).toBe(1);
  });

  it("クライアントが切断すると購読とハートビートを自動で解除する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const stop = vi.fn();
    const hub = new WsHub(pubsub, buildHeartbeat(stop));
    const { connection, fireClose } = buildConnection();

    hub.attach(connection, { topics: [testTopic] });
    fireClose();

    expect(subscribers.get(testTopic)?.length).toBe(0);
    expect(stop).toHaveBeenCalledOnce();
  });

  it("ブロードキャストは封筒形式で PubSub に配信する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());

    await hub.broadcast(testTopic, "Invited", { invitationId: "i1" });

    expect(pubsub.publish).toHaveBeenCalledWith(testTopic, {
      name: "Invited",
      data: { invitationId: "i1" },
    });
  });

  it("トピックへの配信後に購読中の接続へ封筒を転送する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();

    hub.attach(connection, { topics: [testTopic] });
    await hub.broadcast(testTopic, "Message", { text: "hi" });

    expect(connection.send).toHaveBeenCalledWith("Message", { text: "hi" });
  });

  it("`Pong` 封筒の受信は `onMessage` に渡さずハートビートにのみ通知する", () => {
    const { pubsub } = buildPubSub();
    const onPong = vi.fn();
    const hub = new WsHub(
      pubsub,
      buildHeartbeat(() => {}, onPong),
    );
    const { connection, fireMessage } = buildConnection();
    const onMessage = vi.fn();

    hub.attach(connection, { topics: [testTopic], onMessage });
    fireMessage(`{"name":"Pong","data":{}}`);

    expect(onPong).toHaveBeenCalledOnce();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("`Pong` 以外の封筒は `onMessage` に転送する", () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection, fireMessage } = buildConnection();
    const onMessage = vi.fn();

    hub.attach(connection, { topics: [testTopic], onMessage });
    fireMessage(`{"name":"Invite","data":{"inviteeId":"invitee"}}`);

    expect(onMessage).toHaveBeenCalledWith(connection, {
      name: "Invite",
      data: { inviteeId: "invitee" },
    });
  });

  it("不正な JSON や `name` を持たないメッセージは無視する", () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection, fireMessage } = buildConnection();
    const onMessage = vi.fn();

    hub.attach(connection, { topics: [testTopic], onMessage });
    fireMessage("not-json");
    fireMessage(`{"data":"missing-name"}`);
    fireMessage(`{"name":123}`);

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("`topics` に複数件渡すと各トピックを別々に購読する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();
    const otherTopic = "room:abc:hallway:message:m1" as HallwayTopic;

    hub.attach(connection, { topics: [testTopic, otherTopic] });

    expect(subscribers.get(testTopic)?.length).toBe(1);
    expect(subscribers.get(otherTopic)?.length).toBe(1);
  });

  it("複数トピックを購読しているとき切断時に全 subscription を解除する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection, fireClose } = buildConnection();
    const otherTopic = "room:abc:hallway:message:m1" as HallwayTopic;

    hub.attach(connection, { topics: [testTopic, otherTopic] });
    fireClose();

    expect(subscribers.get(testTopic)?.length).toBe(0);
    expect(subscribers.get(otherTopic)?.length).toBe(0);
  });

  it("片方のトピックへの配信は他方の購読側に転送しない", async () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const memberA = buildConnection(testRoomId, "member-a" as MemberId);
    const memberB = buildConnection(testRoomId, "member-b" as MemberId);
    const messageA = "room:abc:hallway:message:member-a" as HallwayTopic;
    const messageB = "room:abc:hallway:message:member-b" as HallwayTopic;

    hub.attach(memberA.connection, { topics: [testTopic, messageA] });
    hub.attach(memberB.connection, { topics: [testTopic, messageB] });
    await hub.broadcast(messageA, "Message", { text: "secret" });

    expect(memberA.connection.send).toHaveBeenCalledWith("Message", { text: "secret" });
    expect(memberB.connection.send).not.toHaveBeenCalled();
  });

  it("接続時の初期処理コールバックを実行する", async () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection();
    const onAttach = vi.fn();

    hub.attach(connection, { topics: [testTopic], onAttach });
    await new Promise((resolve) => setImmediate(resolve));

    expect(onAttach).toHaveBeenCalledWith(connection);
  });

  it("起動時に `member-leave` トピックを購読する", () => {
    const { pubsub, subscribers } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());

    hub.onModuleInit();

    expect(subscribers.get(GlobalTopic.MemberLeft)?.length).toBe(1);
  });

  it("`closeByMember` は同一 `roomId` と `memberId` の接続だけを `GoingAway` で閉じる", () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const member = buildConnection(testRoomId, testMemberId);
    const otherMember = buildConnection(testRoomId, "another-member" as MemberId);
    const otherRoom = buildConnection("another-room" as RoomId, testMemberId);

    hub.attach(member.connection, { topics: [testTopic] });
    hub.attach(otherMember.connection, { topics: [testTopic] });
    hub.attach(otherRoom.connection, { topics: [testTopic] });

    hub.closeByMember(testRoomId, testMemberId);

    expect(member.connection.close).toHaveBeenCalledWith(WsCloseCode.GoingAway);
    expect(otherMember.connection.close).not.toHaveBeenCalled();
    expect(otherRoom.connection.close).not.toHaveBeenCalled();
  });

  it("`member-leave` 配信を受けると同一メンバーの接続を閉じる", () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection(testRoomId, testMemberId);

    hub.onModuleInit();
    hub.attach(connection, { topics: [testTopic] });
    void pubsub.publish(GlobalTopic.MemberLeft, { roomId: testRoomId, memberId: testMemberId });

    expect(connection.close).toHaveBeenCalledWith(WsCloseCode.GoingAway);
  });

  it("`member-leave` のペイロードが不正なら何もしない", () => {
    const { pubsub } = buildPubSub();
    const hub = new WsHub(pubsub, buildHeartbeat());
    const { connection } = buildConnection(testRoomId, testMemberId);

    hub.onModuleInit();
    hub.attach(connection, { topics: [testTopic] });
    void pubsub.publish(GlobalTopic.MemberLeft, { broken: "payload" });

    expect(connection.close).not.toHaveBeenCalled();
  });
});
