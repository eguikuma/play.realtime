"use client";

import { Plus } from "lucide-react";

import { cn } from "@/libraries/classname";

/**
 * ポップオーバー開閉のきっかけに渡す状態とコールバック
 */
type Trigger = {
  open: boolean;
  onToggle: () => void;
};

/**
 * 帯表示の右端で ポップオーバーの開閉を切り替える十字形ボタン
 * 開いている間は 45 度回転させて 閉じる操作だと視覚的に伝える
 */
export const Trigger = ({ open, onToggle }: Trigger) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label="作業音を開く"
    aria-expanded={open}
    className={cn(
      "inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lamp/50",
      open ? "bg-paper text-ink" : "text-ink-mute hover:bg-paper hover:text-ink",
    )}
  >
    <Plus className={cn("size-4 transition-transform", open && "rotate-45")} aria-hidden />
  </button>
);
