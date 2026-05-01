"use client";

import { type Member, Room, type RoomId, RoomMembership } from "@play.realtime/contracts";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { http } from "@/libraries/http-client";
import { HttpFailure } from "@/libraries/transport/http";

import { isMissing } from "./errors";
import { useRoom } from "./store";

/**
 * ルーム参照時のクライアント側の文脈を表す 3 つの結末
 * `joined` は参加済み本人 `guest` は未参加で公開情報だけ取れた状態 `missing` はそもそも入れないルーム
 */
type RoomContext =
  | { kind: "joined"; room: Room; me: Member }
  | { kind: "guest"; room: Room }
  | { kind: "missing" };

/**
 * 参加済みルートを先に試し 401 のときだけ公開情報に落として文脈を決めるサブルーチン
 * どの段階でも `isMissing` に当たる応答 (404 / 400) は `missing` として畳み 呼び出し側に一様の結末を返す
 */
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

/**
 * URL のルーム ID を受け取り cookie セッションと突き合わせてルームと自分を復元するフック
 * 結末の振り分けは `fetchRoomContext` に委ね 本体は取得結果をストアと state に流すことに集中する
 * 入れないルーム (消失済み / フォーマット違反) は missing フラグに倒し レンダー時に notFound を投げて route 直下の not-found 画面に遷移させる
 */
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
