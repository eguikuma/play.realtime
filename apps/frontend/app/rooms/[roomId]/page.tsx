"use client";

import type { RoomId } from "@play.realtime/contracts";
import { use } from "react";
import { LoadingBadge } from "@/components/loading-badge";
import { Entrance, RoomStage, useLoad, useRoom } from "@/features/room";

/**
 * `/rooms/{roomId}` のエントリー
 * `useLoad` が読み込み中の間はローディングバッジだけを出し、未入室で成功したら入室フォームの `Entrance`、入室済みなら `RoomStage` を描画する
 * `useLoad` が 404 や 400 を検知すると内部で `notFound()` を呼ぶため、missing 時はこのコンポーネントは描画されずに `not-found.tsx` へ遷移する
 */
export default function RoomEntry({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const branded = roomId as RoomId;
  const { loading } = useLoad(branded);
  const me = useRoom((state) => state.me);

  if (loading) {
    return <LoadingBadge />;
  }

  if (!me) {
    return <Entrance roomId={branded} />;
  }

  return <RoomStage roomId={branded} />;
}
