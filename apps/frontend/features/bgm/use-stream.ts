"use client";

import { BgmEvents, type RoomId } from "@play.realtime/contracts";
import type { z } from "zod";

import { sse } from "@/libraries/clients";
import { origin } from "@/libraries/environment";
import { useSse } from "@/libraries/transport";

import { useBgm } from "./store";

/**
 * BGM の SSE 購読を張り 受信した BGM 状態をストアへ転写するフック
 * ルーム ID がなしの間は接続を張らず UI はストアの既定値を見続ける
 */
export const useStream = (roomId: RoomId | null) => {
  const setState = useBgm((state) => state.setState);

  const url = roomId ? `${origin}/rooms/${roomId}/bgm/stream` : null;

  const handlers = {
    Snapshot: ({ state }) => setState(state),
    Changed: ({ state }) => setState(state),
  } satisfies {
    [K in keyof typeof BgmEvents]: (payload: z.infer<(typeof BgmEvents)[K]>) => void;
  };

  useSse({
    client: sse,
    url,
    events: BgmEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });
};
