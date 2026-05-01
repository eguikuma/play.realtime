"use client";

import { useEffect, useState } from "react";

/**
 * undo 窓の残り秒数と期限切れフラグを 250ms おきに更新するフック
 * 時刻そのものを毎描画計算すると取り逃しが起きるため、サーバ発行の `until` を起点に一定間隔で再計算する
 */
export const useUndoWindow = (until: string) => {
  const [remainingMs, setRemainingMs] = useState(() => new Date(until).getTime() - Date.now());

  useEffect(() => {
    setRemainingMs(new Date(until).getTime() - Date.now());
    const timer = setInterval(() => {
      setRemainingMs(new Date(until).getTime() - Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [until]);

  const seconds = remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / 1000)) : 0;
  const expired = remainingMs <= 0;

  return { seconds, expired };
};
