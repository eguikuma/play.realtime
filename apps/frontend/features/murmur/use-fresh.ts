"use client";

import type { Murmur } from "@play.realtime/contracts";
import { useEffect, useRef, useState } from "react";

/**
 * 直近で新規追加された投稿 ID を返すフック、UI のハイライト演出に使う
 * `seen` を `useRef` で保持することで、再レンダリングでも「一度でも表示済みの ID」を覚え続け、`Snapshot` 受信直後の一括表示では強調を発生させない
 */
export const useFresh = (list: Murmur[]) => {
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    const next = new Set<string>();
    for (const murmur of list) {
      if (!seen.current.has(murmur.id)) {
        next.add(murmur.id);
        seen.current.add(murmur.id);
      }
    }
    if (next.size > 0) setFresh(next);
  }, [list]);

  return fresh;
};
