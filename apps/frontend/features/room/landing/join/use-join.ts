"use client";

import { RoomId } from "@play.realtime/contracts";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

/**
 * 既存ルームの URL 貼り付けから `RoomId` を取り出して遷移させるフォームのフック
 * URL まるごと貼っても機能するよう `/` `?` `#` で分割した末尾を候補とし、`RoomId` の書式に合わなければ toast で貼り直しを促す
 */
export const useJoin = () => {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomId.trim();
    const candidate = trimmed.split(/[/?#]/).filter(Boolean).pop() ?? "";
    if (!RoomId.safeParse(candidate).success) {
      toast.error("もらったリンクをそのまま貼り付けてみてください");
      return;
    }
    router.push(`/rooms/${candidate}`);
  };

  return {
    roomId,
    onChange: setRoomId,
    onSubmit,
  };
};
