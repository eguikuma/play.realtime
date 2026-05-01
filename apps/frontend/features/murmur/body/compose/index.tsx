"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Input } from "@/components/ui/input";
import { cn } from "@/libraries/classname";

import { useCompose } from "./use-compose";

type Compose = {
  /** 投稿先のルーム ID、POST /rooms/{roomId}/murmurs の送信先に使う */
  roomId: RoomId;
  /** 未入室などで投稿を受け付けない状態のとき true、入力欄と送信経路を止める */
  disabled: boolean;
};

/**
 * ひとこと投稿フォーム
 * 入力欄と残り文字数表示を 1 行に収め、空白のみの投稿はフック側で無効化する
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
