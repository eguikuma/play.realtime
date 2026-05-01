import type { Metadata } from "next";
import {
  Geist,
  Instrument_Serif,
  JetBrains_Mono,
  Zen_Kaku_Gothic_New,
  Zen_Maru_Gothic,
} from "next/font/google";

import { cn } from "@/libraries/classname";

import "./globals.css";
import type { ReactNode } from "react";

/**
 * 欧文のサンセリフとして Geist を --font-geist-sans に登録する
 */
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

/**
 * 欧文のセリフとして Instrument Serif を --font-instrument-serif に登録する
 * 正体と斜体の両方を読み込み 見出しで使い分ける
 */
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

/**
 * 欧文の等幅として JetBrains Mono を --font-jetbrains-mono に登録する
 * 時刻や残り秒など 桁揃えが欲しい表示で使う
 */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * 日本語の見出し用として Zen Maru Gothic を --font-zen-maru に登録する
 * 丸ゴシックで柔らかさを出しつつ 中太と太字で見出しの階層を作る
 */
const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-zen-maru",
  display: "swap",
});

/**
 * 日本語のサンセリフとして Zen Kaku Gothic New を --font-zen-kaku に登録する
 * 可読性の高い角ゴシックで本文を占める
 */
const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-zen-kaku",
  display: "swap",
});

/**
 * HTML の head に注入する基本メタデータ
 */
export const metadata: Metadata = {
  title: "りもどき",
  description: "リモートだけどリモートじゃない — ブラウザだけで空気を共有する",
};

/**
 * OS 側の配色設定が暗色なら 初回描画前に html 要素へ反映するインラインスクリプト
 * React のハイドレーションを待つと一瞬明色が見える課題を避けるため head で同期実行する
 */
const applyColorScheme = `(function(){try{if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(_){}})()`;

/**
 * Next.js App Router のルートレイアウト
 * 複数のフォントの CSS 変数を html に束ね body 全体のスクロール挙動を抑える
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="ja"
      className={cn(
        sans.variable,
        serif.variable,
        mono.variable,
        zenMaru.variable,
        zenKaku.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: ダーク配色を初回描画前に決めて FOUC を避けるための inline script */}
        <script dangerouslySetInnerHTML={{ __html: applyColorScheme }} />
      </head>
      <body className="h-svh overflow-hidden font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
