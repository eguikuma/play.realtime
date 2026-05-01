"use client";

import { MurmurEvents, type RoomId } from "@play.realtime/contracts";
import type { z } from "zod";

import { sse } from "@/libraries/clients";
import { origin } from "@/libraries/environment";
import { useSse } from "@/libraries/transport";

import { useMurmur } from "./store";

/**
 * ひとこと投稿の SSE 購読を張り 受信内容をストアへ転写するフック
 * スナップショットは全置換 投稿イベントは末尾追加として扱い UI は 1 箇所の一覧だけを見ていれば済む
 */
export const useStream = (roomId: RoomId | null) => {
  const append = useMurmur((state) => state.append);
  const replace = useMurmur((state) => state.replace);

  const url = roomId ? `${origin}/rooms/${roomId}/murmurs/stream` : null;

  const handlers = {
    Snapshot: ({ items }) => replace(items),
    Posted: (murmur) => append(murmur),
  } satisfies {
    [K in keyof typeof MurmurEvents]: (payload: z.infer<(typeof MurmurEvents)[K]>) => void;
  };

  useSse({
    client: sse,
    url,
    events: MurmurEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });
};
