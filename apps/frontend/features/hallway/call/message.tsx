"use client";

import { cn } from "@/libraries/classname";

/**
 * メッセージ 1 件ぶんの入力
 * 直前のメッセージとの連続性判定から 親が事前計算した結果をもらう
 */
type Message = {
  text: string;
  sentAt: string;
  clock: string;
  fromName: string;
  mine: boolean;
  hasMeta: boolean;
};

/**
 * 会話ログに表示する 1 件ぶんのメッセージ吹き出し
 * 自分のメッセージのときは右寄せで反転色とし 送信者情報の表示は連続性によって出し分ける
 */
export const Message = ({ text, sentAt, clock, fromName, mine, hasMeta }: Message) => (
  <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
    {hasMeta && (
      <span
        className={cn("flex items-baseline gap-2 px-1", mine ? "flex-row-reverse" : "flex-row")}
      >
        <span className="font-bold font-display text-[12px] text-ink-soft">{fromName}</span>
        <time dateTime={sentAt} className="font-sans text-[10px] text-ink-mute tabular-nums">
          {clock}
        </time>
      </span>
    )}
    <p
      className={cn(
        "max-w-[75%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 font-sans text-[14px] leading-relaxed",
        mine ? "rounded-br-sm bg-ink text-paper" : "rounded-bl-sm bg-paper-2 text-ink",
      )}
    >
      {text}
    </p>
  </div>
);
