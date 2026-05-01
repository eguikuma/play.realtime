"use client";

import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

type Shell = {
  /** 画面左側に大きく置く見出し文 */
  headline: string;
  /** 見出しの下に並べる説明文 */
  lede: ReactNode;
  /** 画面右側に置くフォームなどの操作領域 */
  children: ReactNode;
};

/**
 * Landing / Entrance の 2 段組レイアウト
 * 左にワードマークと大きな見出し、右にフォームを並べ、スマートフォン幅では 1 列に畳む
 */
export const Shell = ({ headline, lede, children }: Shell) => (
  <div className="grid w-full max-w-4xl grid-cols-1 gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
    <div className="flex flex-col gap-7">
      <Wordmark />
      <div className="flex flex-col gap-5">
        <h1 className="max-w-[22ch] font-bold font-display text-[52px] text-ink leading-[1.12] tracking-[-0.01em] [word-break:auto-phrase] md:text-[64px]">
          {headline}
        </h1>
        <p className="max-w-[32ch] font-sans text-[14.5px] text-ink-soft leading-relaxed [word-break:auto-phrase]">
          {lede}
        </p>
      </div>
    </div>
    <div className="flex flex-col">{children}</div>
  </div>
);
