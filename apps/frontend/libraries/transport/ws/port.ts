import type { z } from "zod";

/**
 * WebSocket 接続のライフサイクル状態を表す定数オブジェクト
 * SSE 側の `SseState` と意図的に同じ構造にし、UI 層で接続バナーのロジックを共通化できるようにしている
 */
export const WsState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type WsState = (typeof WsState)[keyof typeof WsState];

/**
 * イベント名をキー、対応する Zod schema を値とするマップ
 * `HallwayServerMessages` のような契約マップを渡すと、受信側で型推論とバリデーションの両方が揃う
 */
export type WsEvents = Record<string, z.ZodTypeAny>;

/**
 * `connect` が返す接続ハンドル、`send` でクライアント発コマンドを送り、`close` で接続を終わらせる
 */
export type WsConnection = {
  send: <TData>(name: string, data: TData) => void;
  close: () => void;
};

/**
 * WebSocket クライアントの port 型
 * 実装は `createNativeWsClient` が担い、テストや UI 検証では mock 実装を差し替えられる
 */
export type WsClient = {
  /**
   * 指定 URL に接続して `events` のキーごとに受信リスナーを張る
   * `onEvent` は Zod 検証を通ったペイロードのみで呼ばれる
   * `onStateChange` は接続状態遷移を受け取るオプショナルコールバック
   */
  connect: <TMap extends WsEvents>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: WsState) => void;
  }) => WsConnection;
};
