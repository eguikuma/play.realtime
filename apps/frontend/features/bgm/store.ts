"use client";

import type { BgmState } from "@play.realtime/contracts";
import { create } from "zustand";

/**
 * BGM のクライアント側ストアが持つ形
 * 最新の BGM 状態と更新関数だけの最小形で SSE の受信ごとに全体を置き換える
 */
type Bgm = {
  state: BgmState;
  setState: (state: BgmState) => void;
};

/**
 * BGM の初期状態
 * 未購読や未設定のルームでの安全な代替値として使う
 */
const empty: BgmState = { current: null, undoable: null };

/**
 * BGM のクライアント側ストア
 * 購読フックが受信した `Snapshot` と `Changed` を更新関数で流し込む
 */
export const useBgm = create<Bgm>()((set) => ({
  state: empty,
  setState: (state) => set({ state }),
}));
