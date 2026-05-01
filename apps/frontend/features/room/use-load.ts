"use client";

import { type Member, Room, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { http } from "@/libraries/http-client";
import { HttpFailure } from "@/libraries/transport/http";

import { isMissing } from "./errors";
import { useRoom } from "./store";

type RoomContext =
  | { kind: "joined"; room: Room; me: Member }
  | { kind: "guest"; room: Room }
  | { kind: "missing" };

const fetchRoomContext = async (roomId: RoomId): Promise<RoomContext> => {
  try {
    const { room, me } = await http.get({
      path: `/rooms/${roomId}/me`,
      response: RoomMembership,
    });
    return { kind: "joined", room, me };
  } catch (failure) {
    if (isMissing(failure)) return { kind: "missing" };
    if (!(failure instanceof HttpFailure && failure.status === 401)) throw failure;
  }
  try {
    const room = await http.get({ path: `/rooms/${roomId}`, response: Room });
    return { kind: "guest", room };
  } catch (failure) {
    if (isMissing(failure)) return { kind: "missing" };
    throw failure;
  }
};

export const useLoad = (roomId: RoomId) => {
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const context = await fetchRoomContext(roomId);
      if (context.kind === "missing") {
        setMissing(true);
        return;
      }
      setRoom(context.room);
      if (context.kind === "joined") {
        setMe(context.me);
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setLoading(false);
    }
  }, [roomId, setRoom, setMe]);

  useEffect(() => {
    load();
  }, [load]);

  if (missing) {
    notFound();
  }

  return { loading, error };
};
