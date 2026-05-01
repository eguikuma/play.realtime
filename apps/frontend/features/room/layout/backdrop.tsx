"use client";

import type { ReactNode } from "react";

/**
 * 背景レイアウト部品の入力
 */
type Backdrop = {
  children: ReactNode;
};

/**
 * ランディングと参加画面の全面背景を司るレイアウト部品
 * ランプ風の放射グラデーションを緩やかに漂わせて 画面全体の雰囲気を作る
 */
export const Backdrop = ({ children }: Backdrop) => (
  <div className="scrollable relative h-svh overflow-y-auto">
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 animate-lamp-drift bg-[radial-gradient(ellipse_60%_70%_at_15%_10%,var(--lamp-glow),transparent_60%)]"
    />
    <div className="relative flex min-h-full items-center justify-center px-6 py-16 md:px-10">
      {children}
    </div>
  </div>
);
