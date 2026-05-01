import type { MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { WebSocket } from "ws";
import { WsConnection } from "./connection";

type Handler = (...parameters: unknown[]) => void;

const buildSocket = () => {
  const listeners = new Map<string, Handler[]>();
  const sends: string[] = [];
  let closed = false;

  const socket = {
    on: vi.fn((event: string, handler: Handler) => {
      const list = listeners.get(event) ?? [];
      list.push(handler);
      listeners.set(event, list);
    }),
    send: vi.fn((payload: string) => {
      if (closed) {
        throw new Error("send after close");
      }
      sends.push(payload);
    }),
    close: vi.fn((code?: number) => {
      closed = true;
      void code;
    }),
  } as unknown as WebSocket;

  const fire = (event: string, ...parameters: unknown[]) => {
    for (const handler of listeners.get(event) ?? []) {
      handler(...parameters);
    }
  };

  return { socket, sends, fire };
};

const connectionId = "connection-1";
const memberId = "member-alice" as MemberId;
const roomId = "room-abc-1234" as RoomId;

describe("WsConnection", () => {
  it("送信は封筒を JSON 文字列化してソケットへ送る", () => {
    const { socket, sends } = buildSocket();
    const connection = new WsConnection(connectionId, memberId, roomId, socket);

    connection.send("Hello", { value: 1 });

    expect(sends).toEqual([`{"name":"Hello","data":{"value":1}}`]);
  });

  it("閉じると以後の送信は無視する", () => {
    const { socket, sends } = buildSocket();
    const connection = new WsConnection(connectionId, memberId, roomId, socket);

    connection.close();
    connection.send("Ignored", {});

    expect(sends).toHaveLength(0);
    expect(socket.close).toHaveBeenCalled();
  });

  it("ソケットの `close` イベント検知後の送信は無視する", () => {
    const { socket, sends, fire } = buildSocket();
    const connection = new WsConnection(connectionId, memberId, roomId, socket);

    fire("close");
    connection.send("Ignored", {});

    expect(sends).toHaveLength(0);
  });

  it("`onMessage` は Buffer を文字列化してハンドラに渡す", () => {
    const { socket, fire } = buildSocket();
    const connection = new WsConnection(connectionId, memberId, roomId, socket);
    const handler = vi.fn();

    connection.onMessage(handler);
    fire("message", Buffer.from(`{"name":"Send","data":{"text":"hi"}}`));

    expect(handler).toHaveBeenCalledWith(`{"name":"Send","data":{"text":"hi"}}`);
  });

  it("`onClose` はソケットの `close` イベントを受けて発火する", () => {
    const { socket, fire } = buildSocket();
    const connection = new WsConnection(connectionId, memberId, roomId, socket);
    const callback = vi.fn();

    connection.onClose(callback);
    fire("close");

    expect(callback).toHaveBeenCalled();
  });
});
