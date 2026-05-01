"use client";

import { cn } from "@/libraries/classname";

type Message = {
  text: string;
  sentAt: string;
  clock: string;
  fromName: string;
  mine: boolean;
  hasMeta: boolean;
};

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
