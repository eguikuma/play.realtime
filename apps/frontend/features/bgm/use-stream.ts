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
 * BGM SSE の購読を張り、`Snapshot` と `Changed` をストアへ転写するフック
 * `roomId` が `null` のときは接続せず、入室完了後に購読を開始する
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
