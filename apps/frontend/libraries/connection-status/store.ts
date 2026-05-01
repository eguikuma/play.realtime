"use client";

import { create } from "zustand";

/**
 * 購読対象の輸送路を識別する鍵
 * SSE の 3 本と WebSocket の 1 本を個別に追跡することで どの機能でエラーが起きたかを切り分けられる
 */
export type ConnectionKey = "sse:vibe" | "sse:bgm" | "sse:murmur" | "ws:hallway";

/**
 * SSE と WebSocket に共通する表面的な状態を 4 ノードに揃える
 * 個別の port 側の型 (SseState と WsState) と同じ文字列を使い 変換を挟まずに集約する
 */
export type ConnectionState = "connecting" | "open" | "closed" | "error";

/**
 * 1 本の接続の現在状態と その状態に入った時刻
 * since は切断バーの表示判定に使い エラー継続時間を測る基準点とする
 */
export type ConnectionStatus = {
  state: ConnectionState;
  since: number;
};

type State = {
  statuses: Record<ConnectionKey, ConnectionStatus>;
  setStatus: (key: ConnectionKey, state: ConnectionState) => void;
  reset: () => void;
};

/**
 * ストアの初期値として全鍵を closed で埋めた辞書
 * since は同一時刻でよく 初期化後の判定は setStatus の最初の呼び出しから始まる
 */
const empty = (): Record<ConnectionKey, ConnectionStatus> => {
  const now = Date.now();
  return {
    "sse:vibe": { state: "closed", since: now },
    "sse:bgm": { state: "closed", since: now },
    "sse:murmur": { state: "closed", since: now },
    "ws:hallway": { state: "closed", since: now },
  };
};

/**
 * SSE と WebSocket の接続状態をまとめて持つクライアント側ストア
 * 各輸送路の native 実装から onStateChange 経由で流し込み UI 層は selector 経由で読み出す
 */
export const useConnectionStatus = create<State>()((set) => ({
  statuses: empty(),
  setStatus: (key, state) =>
    set((current) => {
      const existing = current.statuses[key];
      if (existing.state === state) {
        return current;
      }
      return {
        statuses: {
          ...current.statuses,
          [key]: { state, since: Date.now() },
        },
      };
    }),
  reset: () => set({ statuses: empty() }),
}));
