import { Injectable } from "@nestjs/common";
import { SSE_HEARTBEAT_INTERVAL_MS } from "@play.realtime/transport-protocol";
import type { SseConnection } from "./connection";

@Injectable()
export class SseHeartbeat {
  start(connection: SseConnection): () => void {
    const handle = setInterval(() => {
      connection.comment("heartbeat");
    }, SSE_HEARTBEAT_INTERVAL_MS);
    return () => {
      clearInterval(handle);
    };
  }
}
