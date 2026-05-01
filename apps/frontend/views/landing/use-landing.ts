"use client";

import { useState } from "react";
import type { TabValue } from "./tabs";

/**
 * トップページのタブ状態を保持するフック、初期タブは部屋の新規作成側にする
 */
export const useLanding = () => {
  const [tab, setTab] = useState<TabValue>("create");

  return {
    tab,
    onTab: setTab,
  };
};
