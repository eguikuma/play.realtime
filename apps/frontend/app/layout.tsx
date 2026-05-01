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

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-zen-maru",
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-zen-kaku",
  display: "swap",
});

export const metadata: Metadata = {
  title: "りもどき",
  description:
    "リモートだけど、リモートじゃない、出社していたら自然に発生していた日常をブラウザだけで取り戻す",
};

/**
 * Next.js App Router のルートレイアウト
 * 全画面共通のフォント変数、テーマプロバイダ、グローバル接続バナー、トースターを一度だけ束ねて、各ルートは `children` だけに集中できるようにする
 * `suppressHydrationWarning` は next-themes による class 切替の SSR と CSR の差分を握るための印、独自 hydration ロジックを入れているわけではない
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
