"use client";

import { type RefObject, useEffect } from "react";

export const useAutoscroll = (container: RefObject<HTMLElement | null>, count: number) => {
  /* biome-ignore lint/correctness/useExhaustiveDependencies: 新着到着時のみ末尾へ scroll したい */
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [count]);
};
