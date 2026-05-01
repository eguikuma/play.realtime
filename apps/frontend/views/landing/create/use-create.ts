"use client";

import { CreateRoomRequest, RoomEndpoint, RoomMembership } from "@play.realtime/contracts";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import { http } from "@/libraries/http-client";
import { useSession } from "@/stores/session";

/**
 * ルーム新規作成フォームの状態と送信処理をまとめたフック
 * POST 成功で `useSession` を更新し、`router.push` で作成したルーム画面へ遷移する
 * 失敗は toast で通知して、ユーザの入力値は保ったまま再試行できるようにする
 */
export const useCreate = () => {
  const router = useRouter();
  const setRoom = useSession((state) => state.setRoom);
  const setMe = useSession((state) => state.setMe);

  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = hostName.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { room, me } = await http.post({
        endpoint: RoomEndpoint.create(),
        body: { hostName: trimmed },
        request: CreateRoomRequest,
        response: RoomMembership,
      });
      setRoom(room);
      setMe(me);
      router.push(`/rooms/${room.id}`);
    } catch {
      toast.error("部屋をつくれませんでした");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return {
    hostName,
    canSubmit: hostName.trim().length > 0 && !loading,
    loading,
    onChange: setHostName,
    onSubmit,
  };
};
