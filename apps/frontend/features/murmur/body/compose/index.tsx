"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Input } from "@/components/ui/input";
import { cn } from "@/libraries/classname";

import { useCompose } from "./use-compose";

/**
 * 投稿欄の入力
 */
type Compose = {
  roomId: RoomId;
  disabled: boolean;
};

/**
 * ひとこと投稿の入力欄
 * 残り文字数のバッジを右端に添え 残り 14 文字以下で警告色へ切り替える
 */
export const Compose = ({ roomId, disabled }: Compose) => {
  const compose = useCompose({ roomId, disabled });

  return (
    <form
      onSubmit={compose.onSubmit}
      className="flex shrink-0 items-center gap-3 rounded-2xl border border-rule bg-paper-2 px-4 py-2 shadow-[0_16px_40px_-28px_oklch(from_var(--ink)_l_c_h/0.3),0_0_0_1px_oklch(from_var(--paper)_l_c_h/0.6)] md:py-2.5"
    >
      <span className="font-bold font-display text-[13px] text-ink">ひとこと</span>
      <Input
        value={compose.text}
        onChange={(event) => compose.onChange(event.target.value)}
        maxLength={compose.maxLength}
        placeholder="いま、思いついたこと"
        disabled={compose.disabled}
        className="h-9 flex-1 border-0 bg-transparent font-sans text-[15px] text-ink placeholder:text-ink-mute/70 focus-visible:ring-0"
      />
      <span
        aria-live="polite"
        className={cn(
          "shrink-0 font-mono text-[10px] tabular-nums tracking-[0.1em]",
          compose.warn ? "text-ember" : "text-ink-mute",
        )}
      >
        {compose.remaining}
      </span>
    </form>
  );
};
