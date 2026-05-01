"use client";

import { CreateRoomRequest, RoomMembership } from "@play.realtime/contracts";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

import { useRoom } from "@/features/room/store";
import { http } from "@/libraries/http-client";

export const useCreate = () => {
  const router = useRouter();
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);

  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = hostName.trim();
    if (!trimmed) return;

    setLoading(true);
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
