"use client";

import { ChevronDown, PhoneOff } from "lucide-react";
import { Monogram } from "@/components/monogram";

type Head = {
  /** 通話相手の表示名、頭文字アバターと名前ラベルに使う */
  peerName: string;
  /** 通話終了ボタンを押したときに親へ通知するコールバック */
  onLeave: () => void;
  /** 最小化ボタンを押したときに親へ通知するコールバック */
  onMinimize: () => void;
};

/**
 * 通話窓のヘッダ
 * 相手のアバターと名前、最小化ボタン、通話終了ボタンを 1 行に並べる
 */
export const Head = ({ peerName, onLeave, onMinimize }: Head) => (
  <header className="flex items-center gap-3 border-rule/70 border-b px-4 py-3">
    <Monogram
      name={peerName}
      className="size-9 bg-paper-2 text-ink text-sm"
      style={{ boxShadow: "0 0 0 2px var(--lamp), 0 0 14px oklch(from var(--lamp) l c h / 0.35)" }}
    />
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
