import { Injectable } from "@nestjs/common";
import {
  WS_HEARTBEAT_INTERVAL_MS,
  WS_PONG_TIMEOUT_MS,
  WsCloseCode,
} from "@play.realtime/transport-protocol";
import type { WsConnection } from "./connection";

@Injectable()
export class WsHeartbeat {
  start(connection: WsConnection): { stop: () => void; onPong: () => void } {
    let lastPongAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastPongAt;
      if (elapsed > WS_HEARTBEAT_INTERVAL_MS + WS_PONG_TIMEOUT_MS) {
        connection.close(WsCloseCode.PongTimeout);
        return;
      }
      connection.send("Ping", {});
    }, WS_HEARTBEAT_INTERVAL_MS);

    return {
      stop: () => {
        clearInterval(interval);
      },
      onPong: () => {
        lastPongAt = Date.now();
      },
    };
  }
}
