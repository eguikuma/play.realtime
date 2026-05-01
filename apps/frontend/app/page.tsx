"use client";

import { LandingPage } from "@/features/room";

/**
 * ルートパスのエントリーページ
 * ランディングを描くだけの薄いラッパーとし 機能側に実装を閉じ込める
 */
export default function Home() {
  return <LandingPage />;
}
