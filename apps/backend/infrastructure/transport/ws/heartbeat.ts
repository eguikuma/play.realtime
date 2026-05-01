import { Injectable } from "@nestjs/common";
import {
  WS_HEARTBEAT_INTERVAL_MS,
  WS_PONG_TIMEOUT_MS,
  WsCloseCode,
} from "@play.realtime/transport-protocol";
import type { WsConnection } from "./connection";

/**
 * WebSocket 接続に定期ピングを送り ポンの応答が途絶えたら接続を切るサービス
 * プロキシの無通信タイムアウトの回避と 相手側タブの凍結検出を兼ねる
 */
@Injectable()
export class WsHeartbeat {
  /**
   * 定期ピングとポン応答の監視を開始し 停止コールバックとポン受信反映のコールバックを返す
   * 呼び出し側は受信時にポン更新のコールバックを呼び 接続終了の差し込み処理で停止コールバックを呼ぶ
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
