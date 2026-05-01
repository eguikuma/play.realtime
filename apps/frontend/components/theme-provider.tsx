"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * next-themes の `ThemeProvider` を `"use client"` 境界越しに再エクスポートするだけの薄いラッパ
 * サーバコンポーネントである `RootLayout` 直下から直接 import できないため、このラッパを間に挟んで Client Component として取り込む
 */
export const ThemeProvider = ({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
);
