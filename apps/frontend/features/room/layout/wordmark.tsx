"use client";

import { BrandMark } from "./brand-mark";

/**
 * プロダクト名を大きく置くだけのワードマーク
 * Landing、Notice、Entrance の左上に共通で配置する
 */
export const Wordmark = () => (
  <span className="inline-flex items-center gap-3 font-bold font-display text-[42px] text-ink leading-none tracking-[-0.01em]">
    <BrandMark className="size-11 shrink-0" />
    りもどき
  </span>
);
