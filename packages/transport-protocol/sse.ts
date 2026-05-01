/**
 * SSE 接続が生存しているかを確認する心拍の送出間隔
 * プロキシや負荷分散装置の無通信タイムアウトに引っかからない値を選ぶ
 */
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * SSE の再試行フィールドでクライアントに伝える再接続までの待機時間
 * サーバー再起動や一時的な切断でも数秒で自動復帰させる狙いを持つ
 */
export const SSE_RETRY_MS = 3_000;

/**
 * SSE ストリームの応答ヘッダに使う Content-Type
 * EventSource が認識する正規の MIME 型をそのまま指定する
 */
export const SSE_CONTENT_TYPE = "text/event-stream";

/**
 * SSE の通信路に流すイベント名の標準セット
 * 機能をまたいで共通するスナップショットと更新と心拍を命名揺れなく共有する
 */
export const SseEventName = {
  Snapshot: "snapshot",
  Update: "update",
  Heartbeat: "heartbeat",
} as const;
export type SseEventName = (typeof SseEventName)[keyof typeof SseEventName];
