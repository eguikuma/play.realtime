"use client";

import { ChevronUp, PhoneOff } from "lucide-react";
import { Dot } from "@/components/dot";
import { Monogram } from "@/components/monogram";

type Pill = {
  /** 通話相手の表示名、アバターと名前ラベルに使う */
  peerName: string;
  /** ピルを展開して通話窓に戻すときに親へ通知するコールバック */
  onExpand: () => void;
  /** 通話終了ボタンを押したときに親へ通知するコールバック */
  onLeave: () => void;
};

/**
 * 最小化された通話窓のピル形状
 * 展開ボタンと通話終了ボタンだけを残し、通話を閉じずに他の画面操作に集中できる状態を提供する
 */
export const Pill = ({ peerName, onExpand, onLeave }: Pill) => (
  <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-pill border border-rule bg-paper/95 py-1.5 pr-2 pl-3 shadow-[0_16px_32px_-20px_oklch(from_var(--ink)_l_c_h/0.32)] backdrop-blur-md">
    <Monogram
      name={peerName}
      className="size-7 bg-paper-2 text-[11px] text-ink leading-none"
      style={{ boxShadow: "0 0 0 1.5px var(--lamp), 0 0 10px oklch(from var(--lamp) l c h / 0.3)" }}
    />
    <div className="flex min-w-0 flex-col">
      <span className="max-w-[10ch] truncate font-display text-[13px] text-ink leading-none">
        {peerName}
      </span>
      <span className="mt-0.5 flex items-center gap-1 font-sans text-[10px] text-ink-mute leading-none">
        <Dot className="size-1" />
        話してる
      </span>
    </div>
    <button
      type="button"
      onClick={onExpand}
      aria-label="通話を広げる"
      className="inline-flex size-7 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <ChevronUp className="size-3.5" />
    </button>
    <button
      type="button"
      onClick={onLeave}
      aria-label="通話を終了"
      className="inline-flex size-7 items-center justify-center rounded-full border border-rule text-ember transition-colors hover:bg-ember/10"
    >
      <PhoneOff className="size-3.5" />
    </button>
  </div>
);
