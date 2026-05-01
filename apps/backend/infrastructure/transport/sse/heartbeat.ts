import { Injectable } from "@nestjs/common";
import { SSE_HEARTBEAT_INTERVAL_MS } from "@play.realtime/transport-protocol";
import type { SseConnection } from "./connection";

/**
 * SSE 接続に定期コメントを送り プロキシの無通信タイムアウトを回避するサービス
 */
@Injectable()
export class SseHeartbeat {
  /**
   * 定期心拍を開始し 停止のためのコールバックを返す
   * 呼び出し側は接続終了の差し込み処理で 必ず停止コールバックを呼ぶ
   */
  start(connection: SseConnection): () => void {
    const handle = setInterval(() => {
      connection.comment("heartbeat");
    }, SSE_HEARTBEAT_INTERVAL_MS);
    return () => {
      clearInterval(handle);
    };
  }
}
