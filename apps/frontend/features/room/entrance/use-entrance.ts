"use client";

import { JoinRoomRequest, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { notFound } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

import { http } from "@/libraries/http-client";

import { isMissing } from "../errors";
import { useRoom } from "../store";

export const useEntrance = (roomId: RoomId) => {
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);

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
    } catch (failure) {
      if (isMissing(failure)) {
        setMissing(true);
        return;
      }
      toast.error("入室できませんでした");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  if (missing) {
    notFound();
  }

  return {
    name,
    canSubmit: name.trim().length > 0 && !loading,
    loading,
    onChange: setName,
    onSubmit,
  };
};
