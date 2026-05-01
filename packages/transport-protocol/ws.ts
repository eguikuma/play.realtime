/**
 * WebSocket の Ping 送出間隔
 * ブラウザタブの休眠検知には長すぎず、通常負荷では頻度が高すぎない 20 秒で揃える
 */
export const WS_HEARTBEAT_INTERVAL_MS = 20_000;

/**
 * 最後の Pong 受信から切断判定までの許容時間
 * `WS_HEARTBEAT_INTERVAL_MS` に加算して超過した場合に `PongTimeout` で close する
 */
export const WS_PONG_TIMEOUT_MS = 10_000;

/**
 * 廊下トーク WebSocket で使う close code の辞書
 * `1000` `1001` `1008` は RFC 6455 の標準
 * `4001` 〜 `4004` はプロダクト固有の 4000 番台コードを割り当てる
 */
export const WsCloseCode = {
  /** 正常終了 */
  Normal: 1000,
  /** ブラウザタブが閉じられた */
  GoingAway: 1001,
  /** ポリシー違反 */
  PolicyViolation: 1008,
  /** 不正なフレームを受信した */
  InvalidFrame: 4001,
  /** 認可失敗 */
  AuthFailed: 4002,
  /** ルームが存在しない */
  RoomNotFound: 4003,
  /** Pong が返ってこなかった (ゾンビ接続) */
  PongTimeout: 4004,
} as const;
export type WsCloseCode = (typeof WsCloseCode)[keyof typeof WsCloseCode];
