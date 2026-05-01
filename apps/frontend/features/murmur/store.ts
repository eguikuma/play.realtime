"use client";

import type { Murmur } from "@play.realtime/contracts";
import { create } from "zustand";

type MurmurState = {
  list: Murmur[];
  append: (murmur: Murmur) => void;
  replace: (list: Murmur[]) => void;
};

export const useMurmur = create<MurmurState>()((set) => ({
  list: [],
  append: (murmur) => set((state) => ({ list: [...state.list, murmur] })),
  replace: (list) => set({ list }),
}));
