import type { MemberId, RoomId } from "@play.realtime/contracts";
import { SSE_CONTENT_TYPE, SSE_RETRY_MS } from "@play.realtime/transport-protocol";
import type { Response } from "express";

export class SseConnection {
  private closed = false;

  constructor(
    readonly id: string,
    readonly memberId: MemberId,
    readonly roomId: RoomId,
    private readonly response: Response,
  ) {
    this.response.on("close", () => {
      this.closed = true;
    });
  }

  open(): void {
    if (this.closed) {
      return;
    }
    this.response.setHeader("Content-Type", SSE_CONTENT_TYPE);
    this.response.setHeader("Cache-Control", "no-cache, no-transform");
    this.response.setHeader("Connection", "keep-alive");

    this.response.setHeader("X-Accel-Buffering", "no");
    this.response.flushHeaders();
    this.retry(SSE_RETRY_MS);
  }

  comment(text: string): void {
    this.write(`: ${text}\n\n`);
  }

  retry(milliseconds: number): void {
    this.write(`retry: ${milliseconds}\n\n`);
  }

  emit<T>(name: string, data: T, id?: string): void {
    const json = JSON.stringify(data);
    const lines: string[] = [];
    if (id !== undefined) {
      lines.push(`id: ${id}`);
    }
    lines.push(`event: ${name}`);
    for (const line of json.split("\n")) {
      lines.push(`data: ${line}`);
    }
    this.write(`${lines.join("\n")}\n\n`);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.response.end();
  }

  onClose(callback: () => void): void {
    this.response.on("close", callback);
  }

  private write(chunk: string): void {
    if (this.closed) {
      return;
    }
    try {
      this.response.write(chunk);
    } catch {
      this.closed = true;
    }
  }
}
