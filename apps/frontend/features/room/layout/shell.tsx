"use client";

import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

/**
 * 2 段組シェルの入力
 */
type Shell = {
  headline: string;
  lede: ReactNode;
  children: ReactNode;
};

/**
 * ランディングと参加画面で共通する 2 段組シェル
 * 左にワードマークと訴求文 右に子要素として入力欄や情報を置く
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
