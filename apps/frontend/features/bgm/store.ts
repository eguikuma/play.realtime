"use client";

import type { BgmState } from "@play.realtime/contracts";
import { create } from "zustand";

type Bgm = {
  state: BgmState;
  setState: (state: BgmState) => void;
};

const empty: BgmState = { current: null, undoable: null };

export const useBgm = create<Bgm>()((set) => ({
  state: empty,
  setState: (state) => set({ state }),
}));
