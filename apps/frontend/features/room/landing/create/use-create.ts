"use client";

import { CreateRoomRequest, RoomMembership } from "@play.realtime/contracts";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";

import { useRoom } from "@/features/room/store";
import { http } from "@/libraries/clients";

/**
 * ルーム新規発行のビューモデルを組み立てるフック
 * 発行に成功したらストアを埋めて ルームページへ遷移する
 */
export const useCreate = () => {
  const router = useRouter();
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);

  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    const trimmed = hostName.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const { room, me } = await http.post({
        path: "/rooms",
        body: { hostName: trimmed },
        request: CreateRoomRequest,
        response: RoomMembership,
      });
      setRoom(room);
      setMe(me);
      router.push(`/rooms/${room.id}`);
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
    hostName,
    canSubmit: hostName.trim().length > 0 && !loading,
    loading,
    error,
    onChange: setHostName,
    onSubmit,
  };
};
