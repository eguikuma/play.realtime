"use client";

import { X } from "lucide-react";
import { Dot } from "@/components/dot";

type Outgoing = {
  /** 呼んでいる相手の表示名 */
  toName: string;
  /** 呼び出しをキャンセルするときに親へ通知するコールバック */
  onCancel: () => void;
};

/**
 * 自分が誰かに話しかけている最中に画面左下に出す発信中バナー
 * 自分側からは呼び出しをやめる操作だけ提供する
 */
export const Outgoing = ({ toName, onCancel }: Outgoing) => (
  <div
    role="status"
    className="pointer-events-auto flex max-w-[calc(100vw-3rem)] animate-slip-in-flat items-center gap-3 rounded-pill border border-rule bg-paper-2/95 py-2 pr-2 pl-4 shadow-[0_16px_32px_-20px_oklch(from_var(--ink)_l_c_h/0.24)] backdrop-blur-md"
  >
    <Dot className="size-1.5 shrink-0" />
    <span className="max-w-[180px] truncate font-display text-[13px] text-ink-soft">
      {toName}さんを呼んでいます…
    </span>
    <button
      type="button"
      onClick={onCancel}
      aria-label="呼ぶのをやめる"
      className="inline-flex size-6 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-paper hover:text-ink"
    >
      <X className="size-3.5" />
    </button>
  </div>
);
