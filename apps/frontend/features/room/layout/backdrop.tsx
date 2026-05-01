"use client";

import type { ReactNode } from "react";

type Backdrop = {
  /** 背景に重ねて中央に表示したい要素、Landing や Entrance の `Shell` が入る */
  children: ReactNode;
};

/**
 * Landing / Entrance / Notice の背景レイヤー
 * 画面全体に柔らかな lamp グラデーションを敷き、中央寄せの配置領域に子要素を置く
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
