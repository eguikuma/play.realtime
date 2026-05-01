import type { z } from "zod";

/**
 * SSE 接続のライフサイクル状態を表す定数オブジェクト
 * `connecting` は初期接続中、`open` は購読成立、`closed` は正常終了、`error` は回復可能な異常を表し、UI のバナー表示はこの値で分岐する
 */
export const SseState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type SseState = (typeof SseState)[keyof typeof SseState];

/**
 * イベント名をキー、対応する Zod schema を値とするマップ
 * クライアント側は `events` に契約 schema を並べるだけで、受信時の型推論とバリデーションの両方を自動で受け取れる
 */
export type SseEvents = Record<string, z.ZodTypeAny>;

/**
 * `connect` が返す接続ハンドル、`close` を呼ぶと購読を打ち切る
 */
export type SseConnection = {
  close(): void;
};

/**
 * SSE クライアントの port 型
 * 実装は `createNativeSseClient` が担い、テストや UI 検証では mock 実装を差し替えられる
 */
export type SseClient = {
  /**
   * 指定 URL へ接続して `events` のキーごとにリスナーを張る
   * `onEvent` は Zod 検証を通ったペイロードのみで呼ばれ、`onStateChange` は接続状態遷移を受け取るオプショナルコールバック
   */
  connect<TMap extends SseEvents>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: SseState) => void;
  }): SseConnection;
};
