"use client";

import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

/**
 * お知らせ向け中央 1 列シェルの入力
 */
type Notice = {
  headline: string;
  lede: ReactNode;
  children: ReactNode;
};

/**
 * エラー境界や無人化ルーム案内など お知らせ系のページで共通に使う中央 1 列シェル
 * ランディングの 2 段組 (`Shell`) とは別建てで 入力欄を持たない「現状の伝達」専用のレイアウトに寄せる
 * ワードマークを上に小さく据え その下に見出しと補助文 最後にアクションを縦積みする
 */
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
