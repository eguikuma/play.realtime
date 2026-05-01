"use client";

import { Volume2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useIsIos } from "@/libraries/use-is-ios";

type Slider = {
  /** 現在の音量、0 から 100 の整数で受け取る */
  value: number;
  /** つまみを動かしたときに新しい音量を通知するコールバック */
  onValue: (value: number) => void;
  /** 入力を無効化するかどうか、BGM が停止中のときは true を渡す */
  disabled?: boolean;
};

/**
 * BGM の音量調節用スライダー
 * ネイティブの `input[type=range]` を使いつつ、トラックと塗りつぶしを独自の span で重ねてデザインを揃える
 * iOS Safari は WebKit の制約で `audio.volume` が読み取り専用、操作しても音量が変わらないため、当該環境では表示自体を抑止して停止ボタンに集約する
 */
export const Slider = ({ value, onValue, disabled }: Slider) => {
  const isIos = useIsIos();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValue(Number(event.target.value));
  };

  const fill = `${value}%`;

  if (isIos) return null;

  return (
    <label className="flex min-w-0 items-center gap-2">
      <Volume2 aria-hidden className="size-3.5 shrink-0 text-ink-mute" />
      <span className="relative flex h-5 w-16 min-w-0 shrink items-center sm:w-32">
        <span aria-hidden className="absolute inset-y-[9px] right-0 left-0 rounded-pill bg-rule" />
        <span
          aria-hidden
          className="absolute inset-y-[9px] left-0 rounded-pill bg-lamp"
          style={{ width: fill }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label="音量"
          className="relative z-10 h-5 w-full cursor-pointer touch-manipulation appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-lamp [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lamp [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_oklch(from_var(--lamp)_l_c_h/0.22)] focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_oklch(from_var(--lamp)_l_c_h/0.4)]"
        />
      </span>
      <span className="w-[2.4ch] shrink-0 text-right font-mono text-[10px] text-ink-mute tabular-nums">
        {value}
      </span>
    </label>
  );
};
