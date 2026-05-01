import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { SseConnection } from "./connection";

type CloseHandler = () => void;

const buildResponse = () => {
  const closeHandlers: CloseHandler[] = [];
  const writes: string[] = [];
  const headers: Record<string, string> = {};
  let ended = false;

  const response = {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => {
      if (ended) {
        throw new Error("write after end");
      }
      writes.push(chunk);
      return true;
    }),
    end: vi.fn(() => {
      ended = true;
    }),
    on: vi.fn((event: string, callback: CloseHandler) => {
      if (event === "close") {
        closeHandlers.push(callback);
      }
    }),
  } as unknown as Response;

  const fireClose = () => {
    for (const handler of closeHandlers) {
      handler();
    }
  };

  return { response, writes, headers, fireClose };
};

const connectionId = "connection-1" as ConnectionId;
const memberId = "member-alice" as MemberId;
const roomId = "room-abc-1234" as RoomId;

describe("SseConnection", () => {
  it("接続を開くと SSE ヘッダと再接続間隔を送る", () => {
    const { response, writes, headers } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);

    connection.open();

    expect(headers["Content-Type"]).toBe("text/event-stream");
    expect(headers["Cache-Control"]).toContain("no-cache");
    expect(headers["Connection"]).toBe("keep-alive");
    expect(headers["X-Accel-Buffering"]).toBe("no");
    expect(writes.some((chunk) => chunk.startsWith("retry:"))).toBe(true);
  });

  it("イベントを送るとイベント名と JSON を行ごとに書き出す", () => {
    const { response, writes } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);
    connection.open();

    connection.emit("posted", { text: "hello" });

    const chunk = writes.find((each) => each.includes("event: posted"));
    expect(chunk).toBeDefined();
    expect(chunk).toContain(`data: {"text":"hello"}`);
    expect(chunk?.endsWith("\n\n")).toBe(true);
  });

  it("イベントに `id` を渡すと `id` 行を付与する", () => {
    const { response, writes } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);
    connection.open();

    connection.emit("posted", { text: "hi" }, "murmur-1");

    const chunk = writes.find((each) => each.includes("event: posted"));
    expect(chunk).toContain("id: murmur-1");
  });

  it("コメントを送るとコメント行として書き出す", () => {
    const { response, writes } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);
    connection.open();

    connection.comment("heartbeat");

    expect(writes.some((chunk) => chunk === ": heartbeat\n\n")).toBe(true);
  });

  it("接続を閉じた後の送信は無視する", () => {
    const { response, writes } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);
    connection.open();
    const writtenBefore = writes.length;

    connection.close();
    connection.comment("ignored");
    connection.emit("ignored", {});

    expect(writes.length).toBe(writtenBefore);
  });

  it("クライアント切断後の送信は無視する", () => {
    const { response, writes, fireClose } = buildResponse();
    const connection = new SseConnection(connectionId, memberId, roomId, response);
    connection.open();
    const writtenBefore = writes.length;

    fireClose();
    connection.comment("ignored");

    expect(writes.length).toBe(writtenBefore);
  });
});
