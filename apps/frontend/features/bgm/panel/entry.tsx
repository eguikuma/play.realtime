"use client";

import { AudioLines, Play } from "lucide-react";

import { cn } from "@/libraries/classname";

import type { Track } from "../tracks";

type Entry = {
  /** ライブラリに並ぶ 1 曲分のメタデータ */
  track: Track;
  /** この曲が現在鳴っているかどうか、true のときはボタンを無効化して選曲中を示す */
  tuned: boolean;
  /** この曲を選んだときに親へ通知するコールバック */
  onSelect: () => void;
};

/**
 * 選曲パネルのライブラリに並ぶ 1 件の曲エントリ
 * 再生中の曲は操作できないように `disabled` を付け、アイコンを波形に変えて他の曲と区別する
 */
export const Entry = ({ track, tuned, onSelect }: Entry) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={tuned}
    className={cn(
      "flex w-full min-w-0 items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors",
      tuned ? "cursor-default bg-lamp-soft/40" : "hover:bg-paper-2 focus-visible:bg-paper-2",
    )}
  >
    <span className="min-w-0 flex-1">
      <span className="block truncate font-bold font-display text-ink text-sm">{track.title}</span>
      <span className="block truncate font-sans text-[12px] text-ink-mute">{track.artist}</span>
    </span>
    {tuned ? (
      <AudioLines aria-hidden className="size-4 shrink-0 animate-pulse-dot text-lamp" />
    ) : (
      <Play aria-hidden className="size-4 shrink-0 text-ink-soft" />
    )}
  </button>
);
