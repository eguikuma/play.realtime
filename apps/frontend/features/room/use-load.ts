"use client";

import { Room, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { useCallback, useEffect, useState } from "react";

import { http } from "@/libraries/clients";
import { HttpFailure } from "@/libraries/transport/http";

import { useRoom } from "./store";

/**
 * URL からルーム ID を受け取り cookie セッションと突き合わせてルームと自分を復元するフック
 * 401 のときは参加前とみなし ルームの公開情報だけを取得して参加画面へ導く
 */
export const useLoad = (roomId: RoomId) => {
  const setRoom = useRoom((state) => state.setRoom);
  const setMe = useRoom((state) => state.setMe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { room, me } = await http.get({
        path: `/rooms/${roomId}/me`,
        response: RoomMembership,
      });
      setRoom(room);
      setMe(me);
    } catch (failure) {
      if (failure instanceof HttpFailure && failure.status === 401) {
        try {
          const room = await http.get({ path: `/rooms/${roomId}`, response: Room });
          setRoom(room);
        } catch (fallback) {
          setError(fallback);
        }
      } else {
        setError(failure);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, setRoom, setMe]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error };
};
