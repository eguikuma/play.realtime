"use client";

import type { ReactNode } from "react";

/**
 * 小さな見出し風ラベルの入力
 */
type Label = {
  children: ReactNode;
};

/**
 * 入力欄の上に置く小さなラベル
 * サンセリフ 12px を一貫して使うため共通部品として切り出す
 */
export const Label = ({ children }: Label) => (
  <span className="font-medium font-sans text-[12px] text-ink-soft">{children}</span>
);
