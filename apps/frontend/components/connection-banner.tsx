"use client";

import { useEffect, useState } from "react";

import { useConnectionStatus } from "@/libraries/connection-status/store";

/**
 * エラー状態が 3 秒以上継続したときにだけ出すしきい値
 * 瞬断を即時に画面へ出すとノイズになるため わざと遅らせて腰を据えて現れるようにする
 */
const VISIBLE_MS = 3_000;

/**
 * 切断が続いているときに画面上端へ静かに現れる細い通知バー
 * 4 本ある輸送路のうち 最も古くエラーに入ったものを基準に継続時間を測り VISIBLE_MS を越えたら出す
 * 復帰すれば即時に引っ込める
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
