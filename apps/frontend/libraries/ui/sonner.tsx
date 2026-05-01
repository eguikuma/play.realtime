"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Sonner のトースト表示をプロジェクト側の見た目に寄せた wrapper
 * `next-themes` のテーマ値を `Sonner` に渡してライトとダークの切り替えと同期させる
 * 既定のアイコンを lucide に差し替え、`richColors` を有効にして成功、警告、エラーの色味を標準化する
 * 背景色と枠色は `--normal-*` CSS 変数を `--popover` 等の UI トークンへ振り直し、他のサーフェスと同じ見た目に揃える
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const resolved = (theme ?? "system") as NonNullable<ToasterProps["theme"]>;

  return (
    <Sonner
      theme={resolved}
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
