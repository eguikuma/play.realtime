import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { RawData, WebSocket } from "ws";

type Envelope = {
  name: string;
  data: unknown;
};

export class WsConnection {
  private closed = false;

  constructor(
    readonly id: string,
    readonly memberId: MemberId,
    readonly roomId: RoomId,
    private readonly socket: WebSocket,
  ) {
    this.socket.on("close", () => {
      this.closed = true;
    });
  }

  send<T>(name: string, data: T): void {
    if (this.closed) {
      return;
    }
    const envelope: Envelope = { name, data };
    try {
      this.socket.send(JSON.stringify(envelope));
    } catch {
      this.closed = true;
    }
  }

  close(code?: number): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.socket.close(code);
  }

  onMessage(handler: (raw: string) => void): void {
    this.socket.on("message", (data: RawData) => {
      handler(typeof data === "string" ? data : data.toString());
    });
  }

  onClose(callback: () => void): void {
    this.socket.on("close", callback);
  }
}
