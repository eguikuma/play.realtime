import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useConnectionStatus } from "./store";

describe("useConnectionStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T00:00:00Z"));
    useConnectionStatus.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期状態では 4 鍵すべてが closed で since が同一時刻で埋まる", () => {
    const statuses = useConnectionStatus.getState().statuses;
    const now = Date.now();
    expect(statuses["sse:vibe"]).toEqual({ state: "closed", since: now });
    expect(statuses["sse:bgm"]).toEqual({ state: "closed", since: now });
    expect(statuses["sse:murmur"]).toEqual({ state: "closed", since: now });
    expect(statuses["ws:hallway"]).toEqual({ state: "closed", since: now });
  });

  it("setStatus で状態が変わると since が現在時刻に更新される", () => {
    vi.advanceTimersByTime(5_000);
    useConnectionStatus.getState().setStatus("sse:vibe", "open");

    const status = useConnectionStatus.getState().statuses["sse:vibe"];
    expect(status.state).toBe("open");
    expect(status.since).toBe(new Date("2026-04-23T00:00:05Z").getTime());
  });

  it("同じ状態を連続で流し込んでも since は維持される", () => {
    vi.advanceTimersByTime(1_000);
    useConnectionStatus.getState().setStatus("ws:hallway", "error");
    const first = useConnectionStatus.getState().statuses["ws:hallway"].since;

    vi.advanceTimersByTime(3_000);
    useConnectionStatus.getState().setStatus("ws:hallway", "error");
    const second = useConnectionStatus.getState().statuses["ws:hallway"].since;

    expect(second).toBe(first);
  });

  it("reset で全鍵が closed に戻り since も揃う", () => {
    useConnectionStatus.getState().setStatus("sse:vibe", "open");
    useConnectionStatus.getState().setStatus("ws:hallway", "error");

    vi.advanceTimersByTime(10_000);
    useConnectionStatus.getState().reset();

    const statuses = useConnectionStatus.getState().statuses;
    const now = Date.now();
    for (const key of ["sse:vibe", "sse:bgm", "sse:murmur", "ws:hallway"] as const) {
      expect(statuses[key]).toEqual({ state: "closed", since: now });
    }
  });
});
