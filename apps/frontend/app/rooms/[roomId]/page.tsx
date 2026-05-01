"use client";

import type { RoomId } from "@play.realtime/contracts";
import { use } from "react";
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
    return (
      <div
        aria-label="読み込み中"
        aria-busy="true"
        role="status"
        className="flex min-h-svh items-center justify-center"
      >
        <span aria-hidden className="relative flex size-10 items-center justify-center">
          <span
            className="absolute inset-0 animate-breath rounded-full"
            style={{
              boxShadow: "0 0 0 2px var(--lamp), 0 0 32px 4px oklch(from var(--lamp) l c h / 0.5)",
            }}
          />
          <span className="size-2.5 rounded-full bg-lamp" />
        </span>
      </div>
    );
  }

  if (!me) {
    return <Entrance roomId={branded} />;
  }

  return <RoomStage roomId={branded} />;
}
