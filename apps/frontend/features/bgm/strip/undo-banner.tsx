"use client";

import { useUndoWindow } from "../use-undo-window";

type UndoBanner = {
  until: string;

  byName: string;

  onUndo: () => void;
};

export const UndoBanner = ({ until, byName, onUndo }: UndoBanner) => {
  const { seconds, expired } = useUndoWindow(until);

  if (expired) return null;

  return (
    <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 flex items-center justify-between gap-3 rounded-md border border-rule bg-paper/95 px-4 py-2 shadow-[0_16px_36px_-22px_oklch(from_var(--ink)_l_c_h/0.3)]">
      <span className="min-w-0 truncate font-display text-[13px] text-ink">
        <span className="font-medium">{byName}</span>
        <span className="ml-1 text-ink-soft">が作業音を変えました</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-[11px] text-ink-mute tabular-nums">残り {seconds} 秒</span>
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-1 font-sans text-[12px] text-paper transition-opacity hover:opacity-90"
        >
          元に戻す
        </button>
      </div>
    </div>
  );
};
