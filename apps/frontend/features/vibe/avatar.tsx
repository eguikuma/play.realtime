"use client";

import { MessageCircleHeart } from "lucide-react";

import { cn } from "@/libraries/classname";

/**
 * 1 人分のアバターが取りうる状態
 * `self` は自分のアバター、`present` は在室中で招待できる相手、`focused` はタブ非表示などで集中中の相手、`calling` は他の誰かと通話中の相手を示す
 */
export type AvatarState = "present" | "focused" | "calling" | "self";

const statusLabel: Record<AvatarState, string> = {
  self: "じぶん",
  present: "います",
  focused: "もぐり中",
  calling: "通話中",
};

const statusSr: Record<AvatarState, string> = {
  self: "自分",
  present: "在席中",
  focused: "集中しています",
  calling: "通話中",
};

type Avatar = {
  /** メンバーの表示名、頭文字アバターと名前ラベルに使う */
  name: string;
  /** 現在の状態、ring / breath / opacity のスタイル切り替えとラベル文言に影響する */
  state: AvatarState;
  /** 招待を受け付けない状態のとき true、自分 / 相手の取り込み中 / 通話中などで立てる */
  disabled: boolean;
  /** 招待可能なときにコールバック、招待できない場合は null、null が来たときは UI 側でボタンを出さない */
  onInvite: (() => void) | null;
};

/**
 * Vibe 行に並ぶ 1 人分のアバター
 * 状態に応じて周囲の `ring` による光と頭文字円の呼吸アニメーション、ラベル色、話しかけるボタンの見え方を切り替える
 * 招待可能なときのみ要素全体を `<button>` として扱い、招待不可のときは `<div>` に退避させることでフォーカス可能な操作だけを押せる状態にする
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
