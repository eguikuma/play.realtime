"use client";

import { AudioLines, Play } from "lucide-react";

import { cn } from "@/libraries/classname";

import type { Track } from "../tracks";

type Entry = {
  track: Track;
  tuned: boolean;
  onSelect: () => void;
};

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
