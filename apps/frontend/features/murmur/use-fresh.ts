"use client";

import type { Murmur } from "@play.realtime/contracts";
import { useEffect, useRef, useState } from "react";

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
