"use client";

import { type RefObject, useEffect } from "react";

/**
 * 指定コンテナ外のクリックと Escape キーで `onDismiss` を呼ぶフック
 * BGM パネルや他のオーバーレイ UI の「外側クリックで閉じる」挙動を共通化するために用意している
 * `enabled` が `false` の間はリスナーを張らず、閉じている状態で無駄にグローバルイベントを拾わない
 */
export const useDismiss = (
  container: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: () => void,
) => {
  useEffect(() => {
    if (!enabled) return;

    const onDown = (event: MouseEvent) => {
      const node = container.current;
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
  }, [enabled, container, onDismiss]);
};
