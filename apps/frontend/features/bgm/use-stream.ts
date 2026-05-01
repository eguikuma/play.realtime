"use client";

import { BgmEvents, type RoomId } from "@play.realtime/contracts";
import { useEffect } from "react";
import type { z } from "zod";
import { useConnectionStatus } from "@/libraries/connection-status/store";
import { origin } from "@/libraries/environment";
import { sse } from "@/libraries/sse-client";
import { useSse } from "@/libraries/transport";

import { useBgm } from "./store";

/**
 * BGM の SSE 購読を張り 受信した BGM 状態をストアへ転写するフック
 * 接続状態の遷移は共通ストアへ流し 切断バーの判定素材に使う
 * ルーム ID がなしの間は接続を張らず UI はストアの既定値を見続ける
 */
export const useStream = (roomId: RoomId | null) => {
  const setState = useBgm((store) => store.setState);
  const setConnectionStatus = useConnectionStatus((store) => store.setStatus);

  const url = roomId ? `${origin}/rooms/${roomId}/bgm/stream` : null;

  const handlers = {
    Snapshot: ({ state }) => setState(state),
    Changed: ({ state }) => setState(state),
  } satisfies {
    [K in keyof typeof BgmEvents]: (payload: z.infer<(typeof BgmEvents)[K]>) => void;
  };

  const { state } = useSse({
    client: sse,
    url,
    events: BgmEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });

  useEffect(() => {
    setConnectionStatus("sse:bgm", state);
  }, [state, setConnectionStatus]);
};
