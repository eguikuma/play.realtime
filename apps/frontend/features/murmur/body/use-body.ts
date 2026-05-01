"use client";

import type { RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useRoom } from "@/features/room/store";

import { useMurmur } from "../store";
import { useFresh } from "../use-fresh";
import { useStream } from "../use-stream";

export const useBody = (roomId: RoomId) => {
  const me = useRoom((state) => state.me);
  const members = useRoom((state) => state.room?.members ?? []);
  const list = useMurmur((state) => state.list);

  useStream(me ? roomId : null);
  const fresh = useFresh(list);

  const namesById = useMemo(
    () => new Map(members.map((member) => [member.id, member.name])),
    [members],
  );

  const entries = list.map((murmur) => ({
    murmur,
    authorName: namesById.get(murmur.memberId) ?? "匿名",
    fresh: fresh.has(murmur.id),
  }));

  return {
    roomId,
    composeDisabled: me === null,
    empty: list.length === 0,
    entries,
  };
};
