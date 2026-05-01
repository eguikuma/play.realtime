"use client";

import type { BgmState } from "@play.realtime/contracts";
import { create } from "zustand";

type Bgm = {
  state: BgmState;
  setState: (state: BgmState) => void;
};

const empty: BgmState = { current: null, undoable: null };

/**
 * BGM 機能の合成状態を保持する zustand ストア
 * `Snapshot` と `Changed` のどちらの SSE 受信でも `setState` で全置換し、サーバ側の合成結果をそのまま画面の真実とする
 */
export const useBgm = create<Bgm>()((set) => ({
  state: empty,
  setState: (state) => set({ state }),
}));
