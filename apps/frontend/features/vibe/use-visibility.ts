"use client";

import type { VibeStatus } from "@play.realtime/contracts";
import { useEffect, useRef } from "react";

const visibleDebounceMs = 8_000;

/**
 * `document.visibilityState` をもとに `present` と `focused` の送信を自動化するフック
 * `enabled` が `false` の間は購読しないため、入室前や `connectionId` 未確定の状態で空送信しない
 * 同じ状態の連続送信は `lastSent` で抑止し、サーバ側の集約ロジックに無駄な `Updated` を流さない
 * 初回マウントは `visible` (= `present`) のときだけ `lastSent` の同期に留めて送信を抑制する（サーバ側で SSE 接続成立時に `notifyJoined` が `present` を必ず登録しているため再送が無駄な `Updated` を増やすため）
 * `hidden` (= `focused`) で開かれた稀ケースは初回送信して状態を同期する
 * 以降の `visibilitychange` のうち `hidden` 方向はモバイル系の BFCache 入りで JS が即凍結される経路を踏むため、デバウンスせず `keepalive: true` で即時送信して `pagehide` 前にネットワーク層へ渡し切る
 * `visible` 方向は復帰直後の連打を抑える Upstash 削減目的で `visibleDebounceMs` のトレーリングデバウンスで丸めて短時間のタブ往復を 1 通信に吸収する
 */
export const useVisibility = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (status: VibeStatus, options?: { keepalive?: boolean }) => void;
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

    const dispatch = (next: VibeStatus, options?: { keepalive?: boolean }) => {
      if (lastSent.current === next) {
        return;
      }

      lastSent.current = next;
      latestOnChange.current(next, options);
    };

    const readVisibility = (): VibeStatus =>
      document.visibilityState === "visible" ? "present" : "focused";

    const status = readVisibility();
    if (status === "present") {
      lastSent.current = status;
    } else {
      dispatch(status, { keepalive: true });
    }

    const flushHidden = () => {
      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
      dispatch("focused", { keepalive: true });
    };

    const schedulePresent = () => {
      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
      }
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null;
        dispatch(readVisibility());
      }, visibleDebounceMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        schedulePresent();
      } else {
        flushHidden();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (pendingTimer.current !== null) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
  }, [enabled]);
};
