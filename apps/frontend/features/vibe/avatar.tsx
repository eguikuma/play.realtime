"use client";

import { MessageCircleHeart } from "lucide-react";

import { cn } from "@/libraries/classname";

/**
 * 顔表示の 4 種類の状態
 * サーバー側の空気状態に 自分と通話中を加え UI 専用の状態としてまとめる
 */
export type AvatarState = "present" | "focused" | "calling" | "self";

/**
 * 顔表示の直下に置く状態文言
 * UI に寄せた短い日本語で 4 種類だけを使う
 */
const statusLabel: Record<AvatarState, string> = {
  self: "じぶん",
  present: "います",
  focused: "もぐり中",
  calling: "通話中",
};

/**
 * 読み上げ向けの説明文言
 * 視覚用の文言よりも正確で冗長な表現として分けて持つ
 */
const statusSr: Record<AvatarState, string> = {
  self: "自分",
  present: "在席中",
  focused: "集中しています",
  calling: "通話中",
};

/**
 * 顔表示の入力
 * 招待関数がなしのときは話しかけ不可として div 表示に切り替える
 */
type Avatar = {
  name: string;
  state: AvatarState;
  disabled: boolean;
  onInvite: (() => void) | null;
};

/**
 * メンバー 1 名ぶんの円形の顔表示
 * 状態に応じて輪の色と呼吸演出を切り替え 招待可能なときだけボタンとして振る舞う
 */
export const Avatar = ({ name, state, disabled, onInvite }: Avatar) => {
  const label = `${name}、${statusSr[state]}`;
  const ring =
    state === "present" || state === "self"
      ? "0 0 0 2px var(--lamp), 0 0 24px 2px oklch(from var(--lamp) l c h / 0.45)"
      : state === "calling"
        ? "0 0 0 2px var(--lamp), 0 0 18px 2px oklch(from var(--lamp) l c h / 0.3)"
        : "0 0 0 2px oklch(from var(--ink-mute) l c h / 0.35)";

  const canInvite = onInvite !== null && !disabled;

  const shellClass = cn(
    "group relative flex shrink-0 flex-col items-center gap-2 rounded-xl px-2 pt-1 pb-2 outline-none transition-colors",
    canInvite && "focus-visible:ring-2 focus-visible:ring-lamp/50",
  );

  const content = (
    <>
      <span className="sr-only">{label}</span>
      <span
        className={cn(
          "relative flex size-16 items-center justify-center rounded-full bg-paper-2 font-bold font-display text-[22px] text-ink",
          (state === "present" || state === "self") && "animate-breath",
          state === "focused" && "opacity-60",
        )}
        style={{ boxShadow: ring }}
      >
        {name.slice(0, 1)}
        {state === "calling" && (
          <span
            aria-hidden
            className="absolute top-0 right-0 size-3 animate-pulse-dot rounded-full bg-lamp ring-2 ring-paper"
          />
        )}
      </span>
      <span
        className="max-w-[12ch] truncate font-medium font-sans text-[13px] text-ink"
        title={name}
      >
        {name}
      </span>
      <span
        className={cn(
          "font-display text-[11px]",
          state === "self"
            ? "text-lamp"
            : state === "calling"
              ? "text-lamp"
              : state === "focused"
                ? "text-ink-mute"
                : "text-ink-soft",
        )}
      >
        {statusLabel[state]}
      </span>
      <span
        aria-hidden={!canInvite}
        className={cn(
          "mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-pill border px-2.5 py-0.5 font-medium font-sans text-[11px] transition-colors",
          canInvite
            ? "border-rule bg-paper text-ink-soft shadow-[0_3px_10px_-6px_oklch(from_var(--ink)_l_c_h/0.35)] group-hover:border-lamp/60 group-hover:bg-ink group-hover:text-paper"
            : "pointer-events-none select-none border-transparent bg-transparent text-transparent",
        )}
      >
        <MessageCircleHeart className={cn("size-3", !canInvite && "invisible")} />
        話しかける
      </span>
    </>
  );

  if (canInvite && onInvite) {
    return (
      <button
        type="button"
        onClick={onInvite}
        aria-label={`${name}に話しかける`}
        className={shellClass}
      >
        {content}
      </button>
    );
  }

  return <div className={shellClass}>{content}</div>;
};
