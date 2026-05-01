import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";

describe("SseHeartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("開始すると一定間隔でハートビートを送る", () => {
    const heartbeat = new SseHeartbeat();
    const connection = { comment: vi.fn() } as unknown as SseConnection;

    heartbeat.start(connection);
    vi.advanceTimersByTime(15_000);
    vi.advanceTimersByTime(15_000);

    expect(connection.comment).toHaveBeenCalledTimes(2);
    expect(connection.comment).toHaveBeenCalledWith("heartbeat");
  });

  it("返された停止関数を呼ぶとハートビートが止まる", () => {
    const heartbeat = new SseHeartbeat();
    const connection = { comment: vi.fn() } as unknown as SseConnection;

    const stop = heartbeat.start(connection);
    vi.advanceTimersByTime(15_000);
    stop();
    vi.advanceTimersByTime(60_000);

    expect(connection.comment).toHaveBeenCalledTimes(1);
  });

  it("停止を二度呼んでもエラーにならない", () => {
    const heartbeat = new SseHeartbeat();
    const connection = { comment: vi.fn() } as unknown as SseConnection;

    const stop = heartbeat.start(connection);
    stop();

    expect(() => stop()).not.toThrow();
  });
});
