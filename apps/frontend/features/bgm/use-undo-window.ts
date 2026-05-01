"use client";

import { useEffect, useState } from "react";

/**
 * undo 窓の残り時間を秒単位で観測するフック
 * 失効時刻の ISO 日時から 250 ミリ秒おきに残ミリ秒を再計算し UI の表示と失効判定を揃える
 * 失効直前の 1 秒未満も切り上げて 1 秒と表示することで「残り 0 秒」の違和感を避ける
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
