"use client";

import type { Murmur } from "@play.realtime/contracts";
import { useEffect, useRef, useState } from "react";

/**
 * 直近の描画で新着として到着した ID の集合を返すフック
 * 墨染みのアニメーションをスナップショット全件に掛けず 到着差分だけに絞るための判定材料として使う
 * 観測済みの ID の蓄積は ref で持ち 一覧を差し替えても一度見た ID を再び新着扱いしない
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
