"use client";

import { AudioLines, CircleDashed, Loader2, Pause } from "lucide-react";

type Lead = {
  idle: boolean;
  buffering: boolean;
  paused: boolean;
  playing: boolean;
};

export const Lead = ({ idle, buffering, paused, playing }: Lead) => {
  if (idle) return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
  if (paused) return <Pause aria-hidden className="size-4 text-ink-mute" />;
  if (buffering) return <Loader2 aria-hidden className="size-4 animate-spin text-ink-mute" />;
  if (playing) return <AudioLines aria-hidden className="size-4 animate-pulse-dot text-lamp" />;
  return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
};
