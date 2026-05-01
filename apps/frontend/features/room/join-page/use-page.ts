"use client";

import { JoinRoomRequest, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

import { http } from "@/libraries/clients";

import { useRoom } from "../store";

/**
 * 参加画面のビューモデルを組み立てるフック
 * 名前入力から 参加リクエスト ストア反映までを 1 箇所で完結させる
 * 失敗は Sonner のトーストで伝え レイアウトを揺らさない
 */
export const usePage = (roomId: RoomId) => {
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const { room, me } = await http.post({
        path: `/rooms/${roomId}/members`,
        body: { name: trimmed },
        request: JoinRoomRequest,
        response: RoomMembership,
      });
      setRoom(room);
      setMe(me);
    } catch {
      toast.error("入室できませんでした");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return {
    name,
    canSubmit: name.trim().length > 0 && !loading,
    loading,
    onChange: setName,
    onSubmit,
  };
};
