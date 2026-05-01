"use client";

import { X } from "lucide-react";

type Outgoing = {
  /** 呼んでいる相手の表示名 */
  toName: string;
  /** 呼び出しをキャンセルするときに親へ通知するコールバック */
  onCancel: () => void;
};

/**
 * 自分が誰かに話しかけている最中に画面左下に出す発信中バナー
 * 自分側からは呼び出しをやめる操作だけ提供する、応答待ちの状態を柔らかく伝える
 */
export const Outgoing = ({ toName, onCancel }: Outgoing) => (
  <div
    role="status"
    className="pointer-events-auto flex animate-slip-in items-center gap-3 rounded-pill border border-rule bg-paper-2/95 py-2 pr-2 pl-4 shadow-[0_16px_32px_-20px_oklch(from_var(--ink)_l_c_h/0.24)] backdrop-blur-md"
  >
    <span aria-hidden className="size-1.5 shrink-0 animate-pulse-dot rounded-full bg-lamp" />
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
