"use client";

import { ChevronUp, PhoneOff } from "lucide-react";

/**
 * 最小化中の通話表示に渡す入力
 */
type Pill = {
  peerName: string;
  onExpand: () => void;
  onLeave: () => void;
};

/**
 * 通話を小さくしまった状態の丸型バー
 * 相手の頭文字と名前と話してるの印だけを残し 本体を隠しつつ裏の ひとこと や空気を読めるようにする
 * 右端にひらくボタンと終わるボタンを並べ すぐに元のウィンドウに戻せる
 */
export const Pill = ({ peerName, onExpand, onLeave }: Pill) => (
  <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2 rounded-pill border border-rule bg-paper/95 py-1.5 pr-2 pl-3 shadow-[0_16px_32px_-20px_oklch(from_var(--ink)_l_c_h/0.32)] backdrop-blur-md">
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-2 font-bold font-display text-[11px] text-ink leading-none"
      style={{ boxShadow: "0 0 0 1.5px var(--lamp), 0 0 10px oklch(from var(--lamp) l c h / 0.3)" }}
    >
      {peerName.slice(0, 1)}
    </span>
    <div className="flex min-w-0 flex-col">
      <span className="max-w-[10ch] truncate font-display text-[13px] text-ink leading-none">
        {peerName}
      </span>
      <span className="mt-0.5 flex items-center gap-1 font-sans text-[10px] text-ink-mute leading-none">
        <span aria-hidden className="size-1 animate-pulse-dot rounded-full bg-lamp" />
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
