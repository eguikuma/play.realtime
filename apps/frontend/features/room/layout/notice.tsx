"use client";

import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

type Notice = {
  /** 大きく見せる見出し文、ルームが見つからないなど状態を端的に伝える */
  headline: string;
  /** 見出しの下に補足する説明文、複数行の React ノードを渡せる */
  lede: ReactNode;
  /** 説明の下に並べる行動導線、戻るボタンやリンクなど */
  children: ReactNode;
};

/**
 * ルートエラーや 404 など、単独メッセージを中央寄せで見せる案内レイアウト
 * ワードマーク / 見出し / 説明 / 操作導線の 4 段を縦に並べる
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
