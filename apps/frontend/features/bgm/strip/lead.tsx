"use client";

import { AudioLines, CircleDashed, Loader2, Pause } from "lucide-react";

/**
 * 帯表示の先頭アイコンに渡す状態の 4 軸
 */
type Lead = {
  idle: boolean;
  buffering: boolean;
  paused: boolean;
  playing: boolean;
};

/**
 * 帯表示の先頭に置く状態アイコン
 * 何もない 一時停止 バッファ中 再生中の優先順で 1 つだけを描画する
 */
export const Lead = ({ idle, buffering, paused, playing }: Lead) => {
  if (idle) return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
  if (paused) return <Pause aria-hidden className="size-4 text-ink-mute" />;
  if (buffering) return <Loader2 aria-hidden className="size-4 animate-spin text-ink-mute" />;
  if (playing) return <AudioLines aria-hidden className="size-4 animate-pulse-dot text-lamp" />;
  return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
};
