export const WS_HEARTBEAT_INTERVAL_MS = 20_000;

export const WS_PONG_TIMEOUT_MS = 10_000;

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
