"use client";

import { type RefObject, useEffect } from "react";

/**
 * 新着が届いたときに会話ログを末尾へなめらかに自動スクロールさせるフック
 * メッセージ件数の変化だけを契機にして スクロール位置の外部変更と衝突しないようにする
 */
export const useAutoscroll = (container: RefObject<HTMLElement | null>, count: number) => {
  /* biome-ignore lint/correctness/useExhaustiveDependencies: 新着到着時のみ末尾へ scroll したい */
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [count]);
};
