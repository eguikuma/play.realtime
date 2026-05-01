"use client";

import type { ReactNode } from "react";

type Label = {
  children: ReactNode;
};

export const Label = ({ children }: Label) => (
  <span className="font-medium font-sans text-[12px] text-ink-soft">{children}</span>
);
