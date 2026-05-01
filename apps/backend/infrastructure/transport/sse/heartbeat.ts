import { Injectable } from "@nestjs/common";
import { SSE_HEARTBEAT_INTERVAL_MS } from "@play.realtime/transport-protocol";
import type { SseConnection } from "./connection";

/**
 * SSE 接続ごとに定期コメントを送って切断検知と中継プロキシのタイムアウト回避を担う
 * 間隔は `@play.realtime/transport-protocol` と共有する定数を使い、クライアント側の再接続待ちと合わせて動作する
 */
@Injectable()
export class SseHeartbeat {
  /**
   * heartbeat ループを開始する、戻り値の関数を呼ぶと `clearInterval` で停止する
   */
  start(connection: SseConnection): () => void {
    const timer = setInterval(() => {
      connection.comment("heartbeat");
    }, SSE_HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }
}
