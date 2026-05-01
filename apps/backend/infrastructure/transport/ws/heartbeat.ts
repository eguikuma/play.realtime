import { Injectable } from "@nestjs/common";
import {
  WS_HEARTBEAT_INTERVAL_MS,
  WS_PONG_TIMEOUT_MS,
  WsCloseCode,
} from "@play.realtime/transport-protocol";
import type { WsConnection } from "./connection";

/**
 * WebSocket の Ping Pong 応答を追跡してゾンビ接続を切るサービス
 * ブラウザ側タブが休眠状態になって反応が止まった接続を、サーバ側から能動的に落として他メンバーの取り込み中表示を早めに解除する
 */
@Injectable()
export class WsHeartbeat {
  /**
   * Ping を定期送出する、直近の Pong 受信時刻を見て間隔 + 猶予を超えたら `PongTimeout` で close する
   * 戻り値の `onPong` はクライアントからの `Pong` 受信時にハブから呼ばれ、タイマー起点を更新する
   */
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
