"use client";

import { useState } from "react";

import type { TabValue } from "./tabs";

/**
 * ランディングのタブ切り替えのみを抱える簡易ビューモデル
 * 初期タブは作成とし 新規発行を最も目立つ位置に置く
 */
export const useLanding = () => {
  const [tab, setTab] = useState<TabValue>("create");

  return {
    tab,
    onTab: setTab,
  };
};
