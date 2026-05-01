"use client";

import { useState } from "react";

import type { TabValue } from "./tabs";

export const useLanding = () => {
  const [tab, setTab] = useState<TabValue>("create");

  return {
    tab,
    onTab: setTab,
  };
};
