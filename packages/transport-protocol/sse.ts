/**
 * SSE heartbeat の送出間隔
 * 中継プロキシのアイドルタイムアウトと、ブラウザ側の再接続判断に間に合う 15 秒で揃える
 */
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * クライアント自動再接続の待機時間、サーバが `retry: {ms}` で通知する値
 * 3 秒は通信断からの回復判断と、連続再接続による負荷の間を取った値
 */
export const SSE_RETRY_MS = 3_000;

/**
 * SSE 応答の `Content-Type`
 */
export const SSE_CONTENT_TYPE = "text/event-stream";

/**
 * サーバ / クライアントで共有する SSE イベント名の辞書
 * 機能別の独自イベントとは別に、共通基盤イベントだけをここに集約する
 */
export const SseEventName = {
  /** 購読開始直後の一括配信 */
  Snapshot: "snapshot",
  /** 逐次の差分配信 */
  Update: "update",
  /** 生存確認のコメント行イベント */
  Heartbeat: "heartbeat",
} as const;
export type SseEventName = (typeof SseEventName)[keyof typeof SseEventName];
