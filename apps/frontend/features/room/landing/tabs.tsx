"use client";

import { cn } from "@/libraries/classname";

/**
 * ランディングで切り替える 2 タブの値域
 * 作成は新規発行を 参加は既存ルームへの合流を表す
 */
export type TabValue = "create" | "join";

/**
 * タブ切り替えの入力
 */
type Tabs = {
  tab: TabValue;
  onTab: (value: TabValue) => void;
};

/**
 * ランディングの 2 タブ切り替え UI
 * 丸型の並び切り替えで 選択中のタブのみ背景色を反転する
 */
export const Tabs = ({ tab, onTab }: Tabs) => (
  <div
    role="tablist"
    aria-label="ルーム操作"
    className="inline-flex self-start rounded-pill border border-rule bg-paper-2/70 p-1"
  >
    {(
      [
        { value: "create", label: "部屋をつくる" },
        { value: "join", label: "参加する" },
      ] as const
    ).map((entry) => (
      <button
        key={entry.value}
        type="button"
        role="tab"
        aria-selected={tab === entry.value}
        onClick={() => onTab(entry.value)}
        className={cn(
          "rounded-pill px-4 py-1.5 font-sans text-[13px] outline-none transition-all",
          "focus-visible:ring-2 focus-visible:ring-lamp/50",
          tab === entry.value
            ? "bg-paper text-ink shadow-[0_1px_0_var(--rule)]"
            : "text-ink-mute hover:text-ink",
        )}
      >
        {entry.label}
      </button>
    ))}
  </div>
);
