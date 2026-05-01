"use client";

import { create } from "zustand";

export type ConnectionKey = "sse:vibe" | "sse:bgm" | "sse:murmur" | "ws:hallway";

export type ConnectionState = "connecting" | "open" | "closed" | "error";

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
