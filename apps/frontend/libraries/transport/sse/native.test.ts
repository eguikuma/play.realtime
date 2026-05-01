import { beforeEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";

import { createNativeSseClient } from "./native";
import { SseState } from "./port";

class MockEventSource {
  static readonly CLOSED = 2;
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static last: MockEventSource | undefined;

  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  closed = false;

  constructor(
    public url: string,
    public init?: EventSourceInit,
  ) {
    MockEventSource.last = this;
  }

  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, listener]);
  }

  dispatch(type: string, payload: unknown): void {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    const event = new MessageEvent(type, { data });
    this.listeners.get(type)?.forEach((listener) => {
      listener(event as MessageEvent<string>);
    });
  }

  close(): void {
    this.closed = true;
    this.readyState = MockEventSource.CLOSED;
  }
}

describe("createNativeSseClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MockEventSource.last = undefined;
    vi.stubGlobal("EventSource", MockEventSource);
  });

  it("接続時に `Connecting` を通知する", () => {
    const onStateChange = vi.fn();
    const sse = createNativeSseClient();
    sse.connect({
      url: "http://api.test/stream",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    expect(onStateChange).toHaveBeenCalledWith(SseState.Connecting);
  });

  it("`onopen` が発火すると `Open` を通知する", () => {
    const onStateChange = vi.fn();
    const sse = createNativeSseClient();
    sse.connect({
      url: "http://api.test/stream",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    MockEventSource.last?.onopen?.(new Event("open"));

    expect(onStateChange).toHaveBeenCalledWith(SseState.Open);
  });

  it("登録したイベントを `Zod` で検証して `onEvent` に渡す", () => {
    const onEvent = vi.fn();
    const sse = createNativeSseClient();
    sse.connect({
      url: "http://api.test/stream",
      events: { hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockEventSource.last?.dispatch("hello", { message: "hi" });

    expect(onEvent).toHaveBeenCalledWith("hello", { message: "hi" });
  });

  it("JSON 解析に失敗すると `onEvent` を呼ばず `warn` ログに記録する", () => {
    const onEvent = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sse = createNativeSseClient();
    sse.connect({
      url: "http://api.test/stream",
      events: { hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockEventSource.last?.dispatch("hello", "invalid{{");

    expect(onEvent).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("`Zod` 検証に失敗すると `onEvent` を呼ばず `warn` ログに記録する", () => {
    const onEvent = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sse = createNativeSseClient();
    sse.connect({
      url: "http://api.test/stream",
      events: { hello: z.object({ message: z.string() }) },
      onEvent,
    });

    MockEventSource.last?.dispatch("hello", { message: 123 });

    expect(onEvent).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("`close` で `EventSource` を閉じて `Closed` を通知する", () => {
    const onStateChange = vi.fn();
    const sse = createNativeSseClient();
    const connection = sse.connect({
      url: "http://api.test/stream",
      events: {},
      onEvent: vi.fn(),
      onStateChange,
    });

    connection.close();

    expect(MockEventSource.last?.closed).toBe(true);
    expect(onStateChange).toHaveBeenCalledWith(SseState.Closed);
  });
});
