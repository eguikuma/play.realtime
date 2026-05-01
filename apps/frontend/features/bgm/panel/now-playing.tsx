"use client";

import type { BgmCurrent } from "@play.realtime/contracts";
import { AudioLines, Power, Radio } from "lucide-react";

import type { Track } from "../tracks";

type NowPlaying = {
  current: BgmCurrent | null;

  track: Track | null;

  byName: string | null;

  onStop: () => void;
};

export const NowPlaying = ({ current, track, byName, onStop }: NowPlaying) => (
  <section className="flex flex-col gap-3">
    <header className="flex items-center gap-2 text-ink-mute">
      <Radio aria-hidden className="size-3.5" />
      <span className="font-bold font-display text-[12px] tracking-wider">今鳴っている</span>
    </header>

    {current && track ? (
      <div className="flex items-center gap-3 rounded-sm border border-lamp/40 bg-lamp-soft/30 px-3 py-2">
        <AudioLines aria-hidden className="size-4 shrink-0 animate-pulse-dot text-lamp" />
        <div className="min-w-0 flex-1">
          <span className="block truncate font-display font-medium text-[13px] text-ink">
            {track.title}
          </span>
          <span className="block truncate font-sans text-[11px] text-ink-mute">{track.artist}</span>
          <span className="block truncate font-sans text-[10px] text-ink-soft">
            {byName ?? "unknown"} が選曲
          </span>
        </div>
        <button
          type="button"
          onClick={onStop}
          aria-label="作業音を止める"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-mute outline-none transition-colors hover:bg-paper hover:text-ember focus-visible:ring-2 focus-visible:ring-lamp/50"
        >
          <Power className="size-3.5" />
        </button>
      </div>
    ) : (
      <p className="px-1 font-display text-[13px] text-ink-mute">作業音は流れていません</p>
    )}
  </section>
);
