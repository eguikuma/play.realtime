import type { z } from "zod";

/**
 * SSE 接続の表面的な状態を表す
 * 4 つのノードを UI のインジケータに 1 対 1 で対応させる
 */
export const SseState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type SseState = (typeof SseState)[keyof typeof SseState];

/**
 * イベント名から Zod スキーマへの対応表
 * サーバー側のイベント名と 1 対 1 に揃える前提とする
 */
export type SseEventMap = Record<string, z.ZodTypeAny>;

/**
 * 1 本の SSE 接続を表す操作ハンドル
 * 終了処理は冪等であり 何度呼んでも副作用を起こさない
 */
export type SseConnection = {
  close(): void;
};

/**
 * SSE 通信の抽象ポートを表す
 * ブラウザ標準の EventSource を使う実装を差し替え可能にするため 機能層はこのインタフェース越しに使う
 */
export type SseClient = {
  connect<TMap extends SseEventMap>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: SseState) => void;
  }): SseConnection;
};
