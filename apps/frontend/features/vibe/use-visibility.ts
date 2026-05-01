"use client";

import type { VibeStatus } from "@play.realtime/contracts";
import { useEffect, useRef } from "react";

const debounceMs = 8_000;

/**
 * `document.visibilityState` をもとに `present` と `focused` の送信を自動化するフック
 * `enabled` が `false` の間は購読しないため、入室前や `connectionId` 未確定の状態で空送信しない
 * 同じ状態の連続送信は `lastSent` で抑止し、サーバ側の集約ロジックに無駄な `Updated` を流さない
 * 初回マウントは `visible` (= `present`) のときだけ `lastSent` の同期に留めて送信を抑制する（サーバ側で SSE 接続成立時に `notifyJoined` が `present` を必ず登録しているため再送が無駄な `Updated` を増やすため）
 * `hidden` (= `focused`) で開かれた稀ケースだけは初回送信して状態を同期し、以降の `visibilitychange` は `debounceMs` 窓のトレーリングデバウンスで丸めて短時間のタブ切替や通知確認を 1 通信に吸収する
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
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      lastSent.current = null;

      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }

      return;
    }

    const dispatch = (next: VibeStatus) => {
      if (lastSent.current === next) {
        return;
      }

      lastSent.current = next;
      latestOnChange.current(next);
    };

    const readVisibility = (): VibeStatus =>
      document.visibilityState === "visible" ? "present" : "focused";

    const status = readVisibility();
    if (status === "present") {
      lastSent.current = status;
    } else {
      dispatch(status);
    }

    const schedule = () => {
      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
      }

      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null;

        dispatch(readVisibility());
      }, debounceMs);
    };

    document.addEventListener("visibilitychange", schedule);

    return () => {
      document.removeEventListener("visibilitychange", schedule);

      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
  }, [enabled]);
};
