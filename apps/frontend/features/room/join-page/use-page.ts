"use client";

import { JoinRoomRequest, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";

import { http } from "@/libraries/clients";

import { useRoom } from "../store";

/**
 * 参加画面のビューモデルを組み立てるフック
 * 名前入力から 参加リクエスト ストア反映までを 1 箇所で完結させる
 */
export const usePage = (roomId: RoomId) => {
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const { room, me } = await http.post({
        path: `/rooms/${roomId}/members`,
        body: { name: trimmed },
        request: JoinRoomRequest,
        response: RoomMembership,
      });
      setRoom(room);
      setMe(me);
    } catch (failure) {
      setError(failure);
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
    error,
    onChange: setName,
    onSubmit,
  };
};
