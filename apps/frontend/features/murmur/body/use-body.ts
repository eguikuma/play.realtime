"use client";

import type { RoomId } from "@play.realtime/contracts";
import { useMemo } from "react";

import { useRoom } from "@/features/room/store";

import { useMurmur } from "../store";
import { useFresh } from "../use-fresh";
import { useStream } from "../use-stream";

/**
 * ひとこと本体のビューモデルを組み立てるフック
 * メンバー ID から投稿者名を引き 新着 ID の集合と合わせて表示用の行に整える
 * 自分自身が未解決のあいだは投稿欄を無効にし 誤投稿を防ぐ
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
    roomId,
    composeDisabled: me === null,
    empty: list.length === 0,
    entries,
  };
};
