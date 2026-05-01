"use client";

import { cn } from "@/libraries/classname";

type Message = {
  /** 本文テキスト */
  text: string;
  /** 送信時刻、ISO 8601 文字列、`<time>` の `dateTime` 属性に渡す */
  sentAt: string;
  /** 表示用の HH:MM 形式に整形した時刻 */
  clock: string;
  /** 発言者の表示名、自分の発言であれば「じぶん」を受け取る */
  fromName: string;
  /** 自分の発言かどうか、true のときは右寄せ / 暗い吹き出しに切り替える */
  mine: boolean;
  /** 同じ発言者の連投で 2 件目以降のヘッダ情報 (名前 / 時刻) を省略するときに false を受け取る */
  hasMeta: boolean;
};

/**
 * 通話メッセージの 1 吹き出し
 * `mine` で左右と色を切り替え、`hasMeta` が true のときだけ名前と時刻のヘッダを出す
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
