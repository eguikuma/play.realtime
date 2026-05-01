"use client";

import { type RefObject, useEffect } from "react";

/**
 * メッセージ数が増えたときだけ、対象コンテナを末尾までスムーズにスクロールさせるフック
 * 依存配列を `count` だけに絞ることで、他の再描画きっかけの Effect 実行でスクロールが巻き戻らないようにする
 */
export const useAutoscroll = (container: RefObject<HTMLElement | null>, count: number) => {
  /* biome-ignore lint/correctness/useExhaustiveDependencies: 新着到着時のみ末尾へ scroll したい */
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [count]);
};
