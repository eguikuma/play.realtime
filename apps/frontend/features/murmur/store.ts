"use client";

import type { Murmur } from "@play.realtime/contracts";
import { create } from "zustand";

/**
 * ひとこと投稿のクライアント側ストアが持つ形
 * 一覧は到着順の配列であり 末尾追加で 1 件ずつ積み 全置換はスナップショット受信時に使う
 */
type MurmurState = {
  list: Murmur[];
  append: (murmur: Murmur) => void;
  replace: (list: Murmur[]) => void;
};

/**
 * ひとこと投稿のクライアント側ストア
 * 購読フックが受信したスナップショットは全置換 投稿イベントは末尾追加で反映する
 */
export const useMurmur = create<MurmurState>()((set) => ({
  list: [],
  append: (murmur) => set((state) => ({ list: [...state.list, murmur] })),
  replace: (list) => set({ list }),
}));
