"use client";

import { ChevronDown, PhoneOff } from "lucide-react";

/**
 * 通話ウィンドウ上部に渡す入力
 */
type Head = {
  peerName: string;
  onLeave: () => void;
  onMinimize: () => void;
};

/**
 * 通話ウィンドウの上部の帯
 * 相手の頭文字と名前 しまうボタン そして終了ボタンを配置する
 */
export const Head = ({ peerName, onLeave, onMinimize }: Head) => (
  <header className="flex items-center gap-3 border-rule/70 border-b px-4 py-3">
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-2 font-bold font-display text-ink text-sm"
      style={{ boxShadow: "0 0 0 2px var(--lamp), 0 0 14px oklch(from var(--lamp) l c h / 0.35)" }}
      aria-hidden
    >
      {peerName.slice(0, 1)}
    </span>
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="min-w-0 truncate font-bold font-display text-[15px] text-ink">
        {peerName}
      </span>
      <span className="flex items-center gap-1.5 font-sans text-[11px] text-ink-mute">
        <span aria-hidden className="inline-flex size-1.5 animate-pulse-dot rounded-full bg-lamp" />
        話してる
      </span>
    </div>
    <button
      type="button"
      onClick={onMinimize}
      aria-label="通話をしまう"
      className="inline-flex size-8 items-center justify-center rounded-full border border-rule text-ink-mute transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <ChevronDown className="size-4" />
    </button>
    <button
      type="button"
      onClick={onLeave}
      aria-label="通話を終了"
      className="inline-flex size-8 items-center justify-center rounded-full border border-rule text-ember transition-colors hover:bg-ember/10"
    >
      <PhoneOff className="size-4" />
    </button>
  </header>
);
