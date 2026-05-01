"use client";

import type { RoomId } from "@play.realtime/contracts";
import { LoadingBadge } from "@/components/loading-badge";
import { useSession } from "@/stores/session";
import { Entrance } from "./entrance";
import { Stage } from "./stage";
import { useLeave } from "./use-leave";
import { useLoad } from "./use-load";

type Room = {
  /** 描画対象のルーム ID、子コンポーネントへ渡して各機能の購読先を確定させる */
  roomId: RoomId;
};

/**
 * `/rooms/{roomId}` ルートの view、ルーム画面の入室前と入室後を切り替える orchestrator
 * 初期表示で `useLoad` の 2 段フェッチを走らせ、結果に応じて未入室なら `Entrance`、入室済みなら `Stage` を出し分ける
 * `useLeave` は入室済みのときだけ `pagehide` で退出ビーコンを投げるため、`me` が未確定のうちは `null` を渡して購読を抑える
 */
export const Room = ({ roomId }: Room) => {
  const { loading } = useLoad(roomId);
  const me = useSession((state) => state.me);
  useLeave(me ? roomId : null);

  if (loading) {
    return <LoadingBadge />;
  }

  if (!me) {
    return <Entrance roomId={roomId} />;
  }

  return <Stage roomId={roomId} />;
};
