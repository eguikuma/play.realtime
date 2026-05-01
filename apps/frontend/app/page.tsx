"use client";

import { Landing } from "@/features/room";

/**
 * ルートパスの入口
 * ランディングを描くだけの薄いラッパーとし 機能側に実装を閉じ込める
 */
export default function HomeEntry() {
  return <Landing />;
}
