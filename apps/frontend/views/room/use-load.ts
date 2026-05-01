"use client";

import {
  type Member,
  Room,
  RoomEndpoint,
  type RoomId,
  RoomMembership,
} from "@play.realtime/contracts";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { http } from "@/libraries/http-client";
import { HttpFailure } from "@/libraries/transport/http";
import { useSession } from "@/stores/session";
import { isMissing } from "./errors";

/**
 * ルーム画面の初期表示文脈
 * `joined` は入室済みで自分の Member がある状態で、`guest` は未入室で入室フォームを出す
 * `missing` はルームが存在せず `notFound` に流す
 */
type RoomContext =
  | { kind: "joined"; room: Room; me: Member }
  | { kind: "guest"; room: Room }
  | { kind: "missing" };

/**
 * GET `/rooms/{roomId}/me` を最初に試し、未入室を示す 401 なら GET `/rooms/{roomId}` に降格する 2 段フェッチ
 * 404 と 400 は `missing` 扱い、401 以外の 4xx や 5xx は上位の `catch` に re-throw する
 */
const fetchRoomContext = async (roomId: RoomId): Promise<RoomContext> => {
  try {
    const { room, me } = await http.get({
      endpoint: RoomEndpoint.me(roomId),
      response: RoomMembership,
    });
    return { kind: "joined", room, me };
  } catch (failure) {
    if (isMissing(failure)) return { kind: "missing" };
    if (!(failure instanceof HttpFailure && failure.status === 401)) throw failure;
  }
  try {
    const room = await http.get({ endpoint: RoomEndpoint.get(roomId), response: Room });
    return { kind: "guest", room };
  } catch (failure) {
    if (isMissing(failure)) return { kind: "missing" };
    throw failure;
  }
};

/**
 * ルーム画面のマウント時に 2 段フェッチを走らせ、`useSession` ストアへ結果を転写するフック
 * `missing` は即 `notFound()` で Next.js の 404 に流し、コンポーネント側は描画されずに 404 画面へ遷移する
 * ネットワーク失敗など致命的エラーは `error` state に残し、UI 側で再試行操作を提供できるようにする
 */
export const useLoad = (roomId: RoomId) => {
  const setRoom = useSession((state) => state.setRoom);
  const setMe = useSession((state) => state.setMe);
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
