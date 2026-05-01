"use client";

import { Volume2 } from "lucide-react";
import type { ChangeEvent } from "react";

/**
 * 音量スライダーの入力
 * 値は 0 から 100 の整数であり 変更通知も同じ範囲に丸める前提とする
 */
type Slider = {
  value: number;
  onValue: (value: number) => void;
  disabled?: boolean;
};

/**
 * BGM の音量を調整する水平のスライダー
 * shadcn のスライダー部品は使わず 素の range 入力を Tailwind で直接装飾することで依存を増やさない
 */
export const Slider = ({ value, onValue, disabled }: Slider) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValue(Number(event.target.value));
  };

  const fill = `${value}%`;

  return (
    <label className="flex items-center gap-2">
      <Volume2 aria-hidden className="size-3.5 text-ink-mute" />
      <span className="relative flex h-5 w-24 items-center sm:w-32">
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
          className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-lamp [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lamp [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_oklch(from_var(--lamp)_l_c_h/0.22)] focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_oklch(from_var(--lamp)_l_c_h/0.4)]"
        />
      </span>
      <span className="w-[2.4ch] text-right font-mono text-[10px] text-ink-mute tabular-nums">
        {value}
      </span>
    </label>
  );
};
