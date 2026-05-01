"use client";

import type { ConnectionId, MemberId, Vibe, VibeStatus } from "@play.realtime/contracts";
import { create } from "zustand";

/**
 * 空気のクライアント側ストアが持つ形
 * 状態はメンバーごとの集約後の空気 接続 ID は `Welcome` で受けた自分の接続識別子となる
 */
type VibeState = {
  statuses: Record<string, VibeStatus>;
  connectionId: ConnectionId | null;
  setSnapshot: (statuses: Vibe[]) => void;
  setStatus: (memberId: MemberId, status: VibeStatus) => void;
  remove: (memberId: MemberId) => void;
  setConnectionId: (connectionId: ConnectionId | null) => void;
};

/**
 * 空気のクライアント側ストア
 * 購読フックが受信した `Welcome` `Snapshot` `Joined` `Left` `Update` を対応する設定関数で反映する
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
