"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * 配色テーマの解決と切り替えを一手に引き受けるプロバイダ
 * `next-themes` を薄く包み html 要素への class 付与と 起動時のチラつき抑制スクリプトまで含めて任せる
 * 将来テーマ切り替え UI を足すときも このプロバイダ経由で `useTheme` から setTheme を呼ぶだけで済む
 */
export const ThemeProvider = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
);
