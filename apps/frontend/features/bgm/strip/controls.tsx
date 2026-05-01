"use client";

import { Pause, Play } from "lucide-react";

import { cn } from "@/libraries/classname";

import { Slider } from "../slider";

/**
 * 帯表示の再生操作に渡す状態とコールバック
 * 有効でないときはクリック操作を切って誤操作を防ぐ
 */
type Controls = {
  active: boolean;
  paused: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onVolume: (value: number) => void;
};

/**
 * 再生と一時停止の切り替えと 音量スライダーを 1 列に並べる操作群
 * 有効でないときは透明度を落として視覚的に非活性を示す
 */
export const Controls = ({ active, paused, volume, onPlay, onPause, onVolume }: Controls) => (
  <div
    aria-hidden={!active}
    className={cn(
      "flex items-center gap-2 transition-opacity duration-200",
      active ? "opacity-100" : "pointer-events-none opacity-40",
    )}
  >
    <button
      type="button"
      onClick={paused ? onPlay : onPause}
      disabled={!active}
      aria-label={paused ? "再生" : "一時停止"}
      className="inline-flex size-7 items-center justify-center rounded-md text-ink-mute outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-lamp/50 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
    >
      {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
    </button>
    <Slider value={volume} onValue={onVolume} disabled={!active} />
  </div>
);
