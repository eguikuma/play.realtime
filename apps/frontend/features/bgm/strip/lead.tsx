"use client";

import { AudioLines, CircleDashed, Loader2, Pause } from "lucide-react";

type Lead = {
  /** 曲が選ばれていない無音状態のとき true */
  idle: boolean;
  /** 再生準備中、`<audio>` が `waiting` を発火している間 true */
  buffering: boolean;
  /** 曲は選ばれているがユーザが一時停止しているとき true */
  paused: boolean;
  /** 実際に音が出ているとき true */
  playing: boolean;
};

/**
 * ストリップ左端に置くアイコンで、BGM の再生状態を 1 文字分の領域で示す
 * 判定順は意図的に `idle` 最優先、次に `paused`、その次に `buffering`、最後に `playing` の順にしている
 * ユーザが止めている `paused` はバッファリング表示より優先したい、また状態が欠落したときは無音扱いにフォールバックする
 */
export const Lead = ({ idle, buffering, paused, playing }: Lead) => {
  if (idle) return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
  if (paused) return <Pause aria-hidden className="size-4 text-ink-mute" />;
  if (buffering) return <Loader2 aria-hidden className="size-4 animate-spin text-ink-mute" />;
  if (playing) return <AudioLines aria-hidden className="size-4 animate-pulse-dot text-lamp" />;
  return <CircleDashed aria-hidden className="size-4 text-ink-mute" />;
};
