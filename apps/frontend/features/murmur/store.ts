"use client";

import type { Murmur } from "@play.realtime/contracts";
import { create } from "zustand";

type MurmurState = {
  list: Murmur[];
  append: (murmur: Murmur) => void;
  replace: (list: Murmur[]) => void;
};

/**
 * ひとことタイムラインの配列を保持する zustand ストア
 * `append` は `Posted` 受信で末尾追加
 * `replace` は `Snapshot` 受信で一括置換する
 */
export const useMurmur = create<MurmurState>()((set) => ({
  list: [],
  append: (murmur) => set((state) => ({ list: [...state.list, murmur] })),
  replace: (list) => set({ list }),
}));
