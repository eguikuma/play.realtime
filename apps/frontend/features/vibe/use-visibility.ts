"use client";

import type { VibeStatus } from "@play.realtime/contracts";
import { useEffect, useRef } from "react";

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

    const handle = () => {
      transition(document.visibilityState === "visible" ? "present" : "focused");
    };

    handle();

    document.addEventListener("visibilitychange", handle);

    return () => {
      document.removeEventListener("visibilitychange", handle);
    };
  }, [enabled]);
};
