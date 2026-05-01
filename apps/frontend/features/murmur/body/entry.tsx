"use client";

import type { Murmur } from "@play.realtime/contracts";

import { cn } from "@/libraries/classname";
import { toHHMM } from "@/libraries/date";

type Entry = {
  murmur: Murmur;
  authorName: string;
  fresh: boolean;
};

export const Entry = ({ murmur, authorName, fresh }: Entry) => (
  <article
    className={cn("flex flex-col gap-2", fresh && "animate-ink-bleed")}
    style={fresh ? { animationDelay: "40ms" } : undefined}
  >
    <header className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-2 font-bold font-display text-[12px] text-ink"
        style={{ boxShadow: "inset 0 0 0 1.5px oklch(from var(--lamp) l c h / 0.45)" }}
      >
        {authorName.slice(0, 1)}
      </span>
      <span className="font-bold font-display text-[14px] text-ink">{authorName}</span>
      <time dateTime={murmur.postedAt} className="font-sans text-[11px] text-ink-mute tabular-nums">
        {toHHMM(murmur.postedAt)}
      </time>
    </header>
    <p
      className="max-w-[62ch] whitespace-pre-wrap break-words font-sans text-[15.5px] text-ink leading-[1.75]"
      style={{ textWrap: "pretty" as unknown as string }}
    >
      {murmur.text}
    </p>
  </article>
);
