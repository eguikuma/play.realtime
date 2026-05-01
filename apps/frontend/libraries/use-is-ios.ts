"use client";

import { useEffect, useState } from "react";

/**
 * 実行環境が iOS Safari もしくは iOS 上の WebKit ブラウザかを返すフック
 * SSR 段階では `false` を返し、クライアント側で `useEffect` 実行後に判定結果へ更新する
 * iPad iOS 13 以降は `userAgent` が `Mac` を返すため、`maxTouchPoints` 併用で補完する
 * iOS 制約 (audio.volume が読み取り専用など) に依存する UI を切り替える起点として使う
 */
export const useIsIos = (): boolean => {
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const fromUa = /iPad|iPhone|iPod/.test(ua);
    const fromTouchMac =
      window.navigator.maxTouchPoints > 0 && /Mac/.test(window.navigator.platform);
    setIsIos(fromUa || fromTouchMac);
  }, []);

  return isIos;
};
