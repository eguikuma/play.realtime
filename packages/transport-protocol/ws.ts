/**
 * WebSocket 接続が生存しているかを確認するピングの送出間隔
 * プロキシの無通信タイムアウトとポン返却までの猶予を合わせても十分短く収まる値を選ぶ
 */
export const WS_HEARTBEAT_INTERVAL_MS = 20_000;

/**
 * ピング送出からポン返却までの許容時間
 * これを超えたら接続切断と判断して `PongTimeout` でクローズする
 */
export const WS_PONG_TIMEOUT_MS = 10_000;

/**
 * WebSocket のクローズコード対応表
 * 1xxx は RFC 6455 準拠の標準コードを表し 4xxx は本アプリケーション独自のクローズ理由を表す
 */
export const WsCloseCode = {
  Normal: 1000,
  GoingAway: 1001,
  PolicyViolation: 1008,
  InvalidFrame: 4001,
  AuthFailed: 4002,
  RoomNotFound: 4003,
  PongTimeout: 4004,
} as const;
export type WsCloseCode = (typeof WsCloseCode)[keyof typeof WsCloseCode];
