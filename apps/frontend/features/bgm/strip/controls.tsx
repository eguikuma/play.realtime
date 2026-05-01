"use client";

import { Pause, Play } from "lucide-react";

import { cn } from "@/libraries/classname";

import { Slider } from "../slider";

type Controls = {
  /** 曲が選ばれていて操作を受け付ける状態のとき true、無音のときは false で全体を disabled 風に見せる */
  active: boolean;
  /** 現在の一時停止状態、true のときは再生ボタン、false のときは一時停止ボタンを表示する */
  paused: boolean;
  /** 現在の音量、0 から 100 の整数 */
  volume: number;
  /** 一時停止解除を親に伝えるコールバック */
  onPlay: () => void;
  /** 一時停止を親に伝えるコールバック */
  onPause: () => void;
  /** スライダー操作で音量を親に伝えるコールバック */
  onVolume: (value: number) => void;
};

/**
 * ストリップ右側に置く再生と一時停止のトグル、音量スライダーのまとまり
 * 無音のときは表示は残しつつ操作を止め、透過と `pointer-events-none` でそれを視覚的に伝える
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
