"use client";

import { type RefObject, useEffect } from "react";

/**
 * 外側クリックと Escape キーでポップオーバーを閉じるフック
 * 無効にしている間は何も購読せず マウントや解除のコストを払わない
 */
export const useDismiss = (
  target: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: () => void,
) => {
  useEffect(() => {
    if (!enabled) return;

    const onDown = (event: MouseEvent) => {
      const node = target.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) onDismiss();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [enabled, target, onDismiss]);
};
