import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WsClient, WsConnection } from "./port";
import { WsState } from "./port";
import { createResilientWsClient } from "./resilient";

const TEST_WS_URL = "ws://test/room";

type StubConnection = WsConnection & {
  emit: (state: WsState) => void;
  sent: Array<{ name: string; data: unknown }>;
};

const createStubClient = () => {
  const connections: StubConnection[] = [];
  const client: WsClient = {
    connect: ({ onStateChange }) => {
      const onStateChangeCallback = onStateChange;
      const sent: Array<{ name: string; data: unknown }> = [];
      const stub: StubConnection = {
        send: (name, data) => {
          sent.push({ name, data });
        },
        close: vi.fn(),
        emit: (state) => onStateChangeCallback?.(state),
        sent,
      };
      connections.push(stub);
      onStateChangeCallback?.(WsState.Connecting);
      return stub;
    },
  };
  return { client, connections };
};

describe("createResilientWsClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初回の `connect` で内側クライアントを 1 度だけ呼ぶ", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });

    expect(connections).toHaveLength(1);
  });

  it("`Open` の後に想定外の `Closed` が来ると指数バックオフで再接続する", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Closed);

    expect(connections).toHaveLength(1);
    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(2);
  });

  it("再接続前に `Closed` が連続しても 1 度しか再接続しない", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Error);
    connections[0]?.emit(WsState.Closed);

    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(2);
  });

  it("再接続が連続失敗するとバックオフが伸びる", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Closed);
    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(2);

    connections[1]?.emit(WsState.Closed);
    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(2);
    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(3);
  });

  it("`Open` に戻るとバックオフがリセットされる", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Closed);
    vi.advanceTimersByTime(1_000);
    connections[1]?.emit(WsState.Open);
    connections[1]?.emit(WsState.Closed);

    vi.advanceTimersByTime(1_000);
    expect(connections).toHaveLength(3);
  });

  it("利用側が `close` を呼んだ後は再接続しない", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    const handle = resilient.connect({
      url: TEST_WS_URL,
      events: {},
      onEvent: vi.fn(),
    });
    connections[0]?.emit(WsState.Open);
    handle.close();
    connections[0]?.emit(WsState.Closed);

    vi.advanceTimersByTime(20_000);
    expect(connections).toHaveLength(1);
  });

  it("`visibilitychange` で `visible` になるとバックオフを待たず再接続する", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Closed);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(connections).toHaveLength(2);
    visibility.mockRestore();
  });

  it("`online` イベントでバックオフを待たず再接続する", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    connections[0]?.emit(WsState.Closed);
    window.dispatchEvent(new Event("online"));

    expect(connections).toHaveLength(2);
  });

  it("`Open` 中の `visibilitychange` では再接続しない", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(connections).toHaveLength(1);
    visibility.mockRestore();
  });

  it("利用側に状態遷移を中継する", () => {
    const onStateChange = vi.fn();
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    resilient.connect({
      url: TEST_WS_URL,
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });
    connections[0]?.emit(WsState.Open);

    expect(onStateChange).toHaveBeenCalledWith(WsState.Connecting);
    expect(onStateChange).toHaveBeenCalledWith(WsState.Open);
  });

  it("再接続後の `send` は新しい物理接続に転送する", () => {
    const { client, connections } = createStubClient();
    const resilient = createResilientWsClient(client);

    const handle = resilient.connect({ url: TEST_WS_URL, events: {}, onEvent: vi.fn() });
    connections[0]?.emit(WsState.Open);
    handle.send("First", { value: 1 });
    connections[0]?.emit(WsState.Closed);
    vi.advanceTimersByTime(1_000);
    connections[1]?.emit(WsState.Open);
    handle.send("Second", { value: 2 });

    expect(connections[0]?.sent).toEqual([{ name: "First", data: { value: 1 } }]);
    expect(connections[1]?.sent).toEqual([{ name: "Second", data: { value: 2 } }]);
  });
});
