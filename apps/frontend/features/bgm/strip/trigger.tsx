"use client";

import { Plus } from "lucide-react";

import { cn } from "@/libraries/classname";

type Trigger = {
  /** 選曲パネルが開いているかどうか、アイコンの回転とスタイルに反映する */
  open: boolean;
  /** パネルの開閉を親に伝えるコールバック */
  onToggle: () => void;
};

/**
 * 選曲パネルを開閉するための丸ボタン
 * プラスアイコンを 45 度回転させて閉じる動作を表現する
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
