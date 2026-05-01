"use client";

import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

type Notice = {
  headline: string;
  lede: ReactNode;
  children: ReactNode;
};

export const Notice = ({ headline, lede, children }: Notice) => (
  <div className="flex w-full max-w-md flex-col items-center gap-7 text-center">
    <Wordmark />
    <div className="flex flex-col gap-4">
      <h1 className="font-bold font-display text-[44px] text-ink leading-[1.15] tracking-[-0.01em] [word-break:auto-phrase] md:text-[52px]">
        {headline}
      </h1>
      <p className="font-sans text-[14.5px] text-ink-soft leading-relaxed [word-break:auto-phrase]">
        {lede}
      </p>
    </div>
    <div className="flex w-full flex-col gap-4">{children}</div>
  </div>
);
