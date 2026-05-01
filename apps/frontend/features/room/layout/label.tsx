"use client";

import type { ReactNode } from "react";

type Label = {
  /** ラベルとして表示する文言、フォーム項目名など */
  children: ReactNode;
};

/**
 * フォーム項目の上に置く小さな見出し
 * フォント / 色 / サイズを揃えて Landing / Entrance で共通に使う
 */
export const Label = ({ children }: Label) => (
  <span className="font-medium font-sans text-[12px] text-ink-soft">{children}</span>
);
