"use client";

import type { RoomId } from "@play.realtime/contracts";
import { use } from "react";
import { Room } from "@/views/room";

/**
 * `/rooms/{roomId}` のエントリー、ルーム画面の orchestrator `Room` を 1 行で呼ぶだけのルート層
 * 読み込み、入室フォーム、入室済みステージの切り替えはすべて `Room` 内部で行う
 */
export default function RoomEntry({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  return <Room roomId={roomId as RoomId} />;
}
