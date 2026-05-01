"use client";

import type { ConnectionId, MemberId, Vibe, VibeStatus } from "@play.realtime/contracts";
import { create } from "zustand";

type VibeState = {
  statuses: Record<string, VibeStatus>;
  connectionId: ConnectionId | null;
  setSnapshot: (statuses: Vibe[]) => void;
  setStatus: (memberId: MemberId, status: VibeStatus) => void;
  remove: (memberId: MemberId) => void;
  setConnectionId: (connectionId: ConnectionId | null) => void;
};

/**
 * Vibe 機能の状態を保持する zustand ストア
 * メンバー ID をキーにした `statuses` と、自分の SSE 接続を識別する `connectionId` を束ね、UI と `useVisibility` が購読する
 * `setSnapshot` は購読開始時の一括置換
 * `setStatus` は増分更新
 * `remove` は退室反映
 * `setConnectionId` は `Welcome` 受信時の採番と切断時の `null` リセットに使う
 */
export const useVibe = create<VibeState>()((set) => ({
  statuses: {},
  connectionId: null,
  setSnapshot: (statuses) =>
    set({
      statuses: Object.fromEntries(statuses.map((vibe) => [vibe.memberId, vibe.status])),
    }),
  setStatus: (memberId, status) =>
    set((state) => ({
      statuses: { ...state.statuses, [memberId]: status },
    })),
  remove: (memberId) =>
    set((state) => {
      const next = { ...state.statuses };
      delete next[memberId];
      return { statuses: next };
    }),
  setConnectionId: (connectionId) => set({ connectionId }),
}));
