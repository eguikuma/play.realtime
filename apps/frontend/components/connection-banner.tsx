"use client";

import { useEffect, useState } from "react";

import { useConnectionStatus } from "@/libraries/connection-status/store";

/**
 * 接続異常がこの時間以上継続したときだけバナーを表示する
 * 瞬間的な reconnect では表示せず、復旧まで時間がかかりそうな状態だけユーザに伝えるための閾値
 */
const VISIBLE_MS = 3_000;

/**
 * 4 経路の接続状態を横断的に監視して、3 秒以上 `error` が続いた場合だけ「再接続中」バナーを出す
 * 最古の `error.since` から経過時間を測り、閾値未満の場合は `setTimeout` で再判定タイミングを組む
 */
export const ConnectionBanner = () => {
  const statuses = useConnectionStatus((store) => store.statuses);
  const [now, setNow] = useState(() => Date.now());

  let oldestError: number | null = null;
  for (const status of Object.values(statuses)) {
    if (status.state === "error") {
      if (oldestError === null || status.since < oldestError) {
        oldestError = status.since;
      }
    }
  }

  const elapsed = oldestError === null ? 0 : now - oldestError;
  const visible = oldestError !== null && elapsed >= VISIBLE_MS;

  useEffect(() => {
    if (oldestError === null || visible) {
      return;
    }
    const wait = VISIBLE_MS - elapsed;
    const timer = setTimeout(
      () => {
        setNow(Date.now());
      },
      Math.max(wait, 0),
    );
    return () => clearTimeout(timer);
  }, [oldestError, visible, elapsed]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <div className="pointer-events-auto rounded-full border border-rule bg-paper/90 px-4 py-1.5 font-sans text-[12px] text-ink-soft shadow-[0_1px_0_var(--rule),0_6px_20px_-12px_oklch(from_var(--ink)_l_c_h/0.25)] backdrop-blur-sm">
        再接続中
      </div>
    </div>
  );
};
