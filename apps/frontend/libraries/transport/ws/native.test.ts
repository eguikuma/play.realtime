import { beforeEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { createNativeWsClient } from "./native";
import { WsState } from "./port";

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static last: MockWebSocket | undefined;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onmessage: ((message: MessageEvent<string>) => void) | null = null;
  readonly sent: string[] = [];
  closed = false;

  constructor(public url: string) {
    MockWebSocket.last = this;
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event("close"));
  }

  dispatch(raw: string): void {
    this.onmessage?.(new MessageEvent("message", { data: raw }));
  }
}

describe("createNativeWsClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MockWebSocket.last = undefined;
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  it("接続時に `Connecting` を通知する", () => {
    const onStateChange = vi.fn();
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    expect(onStateChange).toHaveBeenCalledWith(WsState.Connecting);
  });

  it("`onopen` が発火すると `Open` を通知する", () => {
    const onStateChange = vi.fn();
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    MockWebSocket.last?.onopen?.(new Event("open"));

    expect(onStateChange).toHaveBeenCalledWith(WsState.Open);
  });

  it("受信した封筒を `Zod` で検証して `onEvent` に渡す", () => {
    const onEvent = vi.fn();
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: { Hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockWebSocket.last?.dispatch(`{"name":"Hello","data":{"message":"hi"}}`);

    expect(onEvent).toHaveBeenCalledWith("Hello", { message: "hi" });
  });

  it("`Ping` 受信時に自動で `Pong` を送り `onEvent` は呼ばない", () => {
    const onEvent = vi.fn();
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: { Hello: z.object({ message: z.string() }) },
      onEvent,
    });
    const socket = MockWebSocket.last;
    if (!socket) throw new Error("socket not created");
    socket.readyState = MockWebSocket.OPEN;

    socket.dispatch(`{"name":"Ping","data":{}}`);

    expect(socket.sent).toContain(`{"name":"Pong","data":{}}`);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("`Zod` 検証に失敗すると `onEvent` を呼ばず `warn` ログに記録する", () => {
    const onEvent = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: { Hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockWebSocket.last?.dispatch(`{"name":"Hello","data":{"message":123}}`);

    expect(onEvent).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("`events` に無い `name` の封筒は無視する", () => {
    const onEvent = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ws = createNativeWsClient();
    ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: { Hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockWebSocket.last?.dispatch(`{"name":"Unknown","data":{}}`);

    expect(onEvent).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("`OPEN` 状態の送信で封筒をソケットへ送る", () => {
    const ws = createNativeWsClient();
    const connection = ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: {},
      onEvent: vi.fn(),
    });
    const socket = MockWebSocket.last;
    if (!socket) throw new Error("socket not created");
    socket.readyState = MockWebSocket.OPEN;

    connection.send("Invite", { inviteeId: "m2" });

    expect(socket.sent).toContain(`{"name":"Invite","data":{"inviteeId":"m2"}}`);
  });

  it("`CONNECTING` 状態での送信は無視する", () => {
    const ws = createNativeWsClient();
    const connection = ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: {},
      onEvent: vi.fn(),
    });
    const socket = MockWebSocket.last;
    if (!socket) throw new Error("socket not created");

    connection.send("Invite", { inviteeId: "m2" });

    expect(socket.sent).toHaveLength(0);
  });

  it("`close` で `WebSocket` を閉じて `Closed` を通知する", () => {
    const onStateChange = vi.fn();
    const ws = createNativeWsClient();
    const connection = ws.connect({
      url: "ws://api.test/rooms/r1/hallway",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    connection.close();

    expect(MockWebSocket.last?.closed).toBe(true);
    expect(onStateChange).toHaveBeenCalledWith(WsState.Closed);
  });
});
