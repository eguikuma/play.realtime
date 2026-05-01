"use client";

import type { BgmCurrent } from "@play.realtime/contracts";

import type { Track } from "../tracks";

type NowPlaying = {
  current: BgmCurrent | null;

  track: Track | null;
};

export const NowPlaying = ({ current, track }: NowPlaying) => (
  <div className="relative flex min-w-0 flex-1 items-center">
    {current && track ? (
      <span className="flex min-w-0 items-baseline gap-2 font-display text-[14px] text-ink">
        <span className="min-w-0 truncate">
          <span className="font-medium">{track.title}</span>
          <span className="ml-2 text-ink-soft">{track.artist}</span>
        </span>
      </span>
    ) : (
      <span aria-hidden className="h-px flex-1 bg-rule/60" />
    )}
  </div>
);
