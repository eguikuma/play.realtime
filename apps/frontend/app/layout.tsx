import type { Metadata } from "next";
import {
  Geist,
  Instrument_Serif,
  JetBrains_Mono,
  Zen_Kaku_Gothic_New,
  Zen_Maru_Gothic,
} from "next/font/google";

import { ConnectionBanner } from "@/components/connection-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
 * Next.js App Router のルートレイアウト
 * 複数のフォントの CSS 変数を html に束ね body 全体のスクロール挙動を抑える
 * 配色テーマは `ThemeProvider` に委ね OS の設定に追従させつつ 将来の切り替え UI に繋げられる形にしておく
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
      <body className="h-svh overflow-hidden font-sans text-ink antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <ConnectionBanner />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
