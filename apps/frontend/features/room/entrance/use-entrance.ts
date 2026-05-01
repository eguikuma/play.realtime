"use client";

import {
  JoinRoomRequest,
  RoomEndpoint,
  type RoomId,
  RoomMembership,
} from "@play.realtime/contracts";
import { notFound } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

import { http } from "@/libraries/http-client";

import { isMissing } from "../errors";
import { useRoom } from "../store";

/**
 * URL 共有からやってきた未入室ユーザが名前を入れて入室する入室フォームのフック
 * POST 成功で `useRoom` を更新して画面を「入室済み」モードへ切り替え、404 と 400 では Next.js の `notFound()` に流す
 * それ以外の失敗は toast で伝え、UI のフォームは入力内容を保って再試行できるようにする
 */
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
        endpoint: RoomEndpoint.join(roomId),
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
