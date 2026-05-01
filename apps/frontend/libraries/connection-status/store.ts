"use client";

import { create } from "zustand";

/**
 * 画面全体で追跡する接続キー、SSE 3 本 + WebSocket 1 本の計 4 経路を列挙する
 * キー形式は `{プロトコル}:{機能}` に揃え、新しい経路が増えても UI 側の判定を機械的に伸ばせるようにする
 */
export type ConnectionKey = "sse:vibe" | "sse:bgm" | "sse:murmur" | "ws:hallway";

/**
 * 各接続のライフサイクル状態、`SseState` と `WsState` の 4 値と揃えて UI バナーの出し分けを統一する
 */
export type ConnectionState = "connecting" | "open" | "closed" | "error";

/**
 * 接続 1 経路の現在値、`since` で状態遷移時刻を保持して「何秒切れているか」の表示に使う
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
 * 4 経路の接続状態を 1 つの zustand ストアに集約し、`ConnectionBanner` が横断的に参照する
 * 同一値への更新は参照等価性を保って再描画を抑え、`since` は本当に状態が変わったときだけ現在時刻へ上書きする
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
