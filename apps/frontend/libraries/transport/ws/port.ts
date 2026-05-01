import type { z } from "zod";

/**
 * WebSocket 接続の表面的な状態を表す
 * SSE の状態と同じ 4 ノードを揃え UI インジケータの実装を共通化しやすくする
 */
export const WsState = {
  Connecting: "connecting",
  Open: "open",
  Closed: "closed",
  Error: "error",
} as const;

export type WsState = (typeof WsState)[keyof typeof WsState];

/**
 * イベント名から Zod スキーマへの対応表
 * サーバー側のメッセージ一覧と 1 対 1 に揃える前提とする
 */
export type WsEventMap = Record<string, z.ZodTypeAny>;

/**
 * 1 本の WebSocket 接続を表す操作ハンドル
 * 送信と終了はどちらも冪等であり 終了後の送信は静かに捨てる
 */
export type WsConnection = {
  send: <TData>(name: string, data: TData) => void;
  close: () => void;
};

/**
 * WebSocket 通信の抽象ポートを表す
 * ブラウザ標準の WebSocket を使う実装を差し替え可能にするため 機能層はこのインタフェース越しに使う
 */
export type WsClient = {
  connect: <TMap extends WsEventMap>(parameters: {
    url: string;
    events: TMap;
    onEvent: <K extends keyof TMap>(name: K, payload: z.infer<TMap[K]>) => void;
    onStateChange?: (state: WsState) => void;
  }) => WsConnection;
};
