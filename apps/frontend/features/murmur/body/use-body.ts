"use client";

import type { RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useRoom } from "@/features/room/store";

import { useMurmur } from "../store";
import { useFresh } from "../use-fresh";
import { useStream } from "../use-stream";

/**
 * ひとこと本体パネルに必要なデータを組み立てるフック
 * SSE 購読の起動、投稿者名の引き当て、新規投稿のハイライト判定を集約して、UI 側には描画に必要な配列だけを返す
 * 投稿者が退室済みの場合は `匿名` として表示し、サーバ側の memberId が見つからないケースでも画面が崩れないようにする
 */
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
    empty: list.length === 0,
    entries,
  };
};
