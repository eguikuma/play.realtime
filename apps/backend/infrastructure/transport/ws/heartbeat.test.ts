import { WsCloseCode } from "@play.realtime/transport-protocol";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WsConnection } from "./connection";
import { WsHeartbeat } from "./heartbeat";

const buildConnection = () => {
  return {
    send: vi.fn(),
    close: vi.fn(),
  } as unknown as WsConnection;
};

describe("WsHeartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("開始すると一定間隔で Ping 封筒を送る", () => {
    const heartbeat = new WsHeartbeat();
    const connection = buildConnection();

    const { onPong } = heartbeat.start(connection);
    vi.advanceTimersByTime(20_000);
    onPong();
    vi.advanceTimersByTime(20_000);

    expect(connection.send).toHaveBeenCalledTimes(2);
    expect(connection.send).toHaveBeenCalledWith("Ping", {});
  });

  it("onPong が呼ばれていなければ pong タイムアウトでソケットを閉じる", () => {
    const heartbeat = new WsHeartbeat();
    const connection = buildConnection();

    heartbeat.start(connection);
    vi.advanceTimersByTime(20_000);
    vi.advanceTimersByTime(20_000);

    expect(connection.close).toHaveBeenCalledWith(WsCloseCode.PongTimeout);
  });

  it("onPong を呼ぶとタイムアウトが延びてソケットを閉じない", () => {
    const heartbeat = new WsHeartbeat();
    const connection = buildConnection();

    const { onPong } = heartbeat.start(connection);
    vi.advanceTimersByTime(20_000);
    onPong();
    vi.advanceTimersByTime(20_000);

    expect(connection.close).not.toHaveBeenCalled();
  });

  it("stop を呼ぶと以後 Ping を送らない", () => {
    const heartbeat = new WsHeartbeat();
    const connection = buildConnection();

    const { stop } = heartbeat.start(connection);
    vi.advanceTimersByTime(20_000);
    stop();
    vi.advanceTimersByTime(60_000);

    expect(connection.send).toHaveBeenCalledTimes(1);
  });
});
