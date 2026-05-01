"use client";

import type { VibeStatus } from "@play.realtime/contracts";
import { useEffect, useRef } from "react";

/**
 * `document.visibilityState` をもとに `present` と `focused` の送信を自動化するフック
 * `enabled` が `false` の間は購読しないため、入室前や `connectionId` 未確定の状態で空送信しない
 * 同じ状態の連続送信は `lastSent` で抑止し、サーバ側の集約ロジックに無駄な `Updated` を流さない
 */
export const useVisibility = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (status: VibeStatus) => void;
}): void => {
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  const lastSent = useRef<VibeStatus | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastSent.current = null;
      return;
    }

    const transition = (next: VibeStatus) => {
      if (lastSent.current === next) {
        return;
      }
      lastSent.current = next;
      latestOnChange.current(next);
    };

    const apply = () => {
      transition(document.visibilityState === "visible" ? "present" : "focused");
    };

    apply();

    document.addEventListener("visibilitychange", apply);

    return () => {
      document.removeEventListener("visibilitychange", apply);
    };
  }, [enabled]);
};
