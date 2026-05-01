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
