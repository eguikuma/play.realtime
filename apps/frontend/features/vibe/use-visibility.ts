"use client";

import type { VibeStatus } from "@play.realtime/contracts";
import { useEffect, useRef } from "react";

/**
 * タブの見え方 (表示中か隠れているか) を 在室中と作業中に対応付けて通知するフック
 * 同じ状態の連続送信は直近の値で抑制し サーバーへの無駄な送信を避ける
 * 無効にしている間はリスナーを張らず 有効化した瞬間に 1 度だけ評価する
 */
export const useVisibility = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (status: VibeStatus) => void;
}): void => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
      onChangeRef.current(next);
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
