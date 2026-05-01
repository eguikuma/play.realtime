"use client";

import { MurmurEvents, type RoomId } from "@play.realtime/contracts";
import { useEffect } from "react";
import type { z } from "zod";
import { useConnectionStatus } from "@/libraries/connection-status/store";
import { origin } from "@/libraries/environment";
import { sse } from "@/libraries/sse-client";
import { useSse } from "@/libraries/transport";

import { useMurmur } from "./store";

export const useStream = (roomId: RoomId | null) => {
  const append = useMurmur((store) => store.append);
  const replace = useMurmur((store) => store.replace);
  const setConnectionStatus = useConnectionStatus((store) => store.setStatus);

  const url = roomId ? `${origin}/rooms/${roomId}/murmurs/stream` : null;

  const handlers = {
    Snapshot: ({ items }) => replace(items),
    Posted: (murmur) => append(murmur),
  } satisfies {
    [K in keyof typeof MurmurEvents]: (payload: z.infer<(typeof MurmurEvents)[K]>) => void;
  };

  const { state } = useSse({
    client: sse,
    url,
    events: MurmurEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });

  useEffect(() => {
    setConnectionStatus("sse:murmur", state);
  }, [state, setConnectionStatus]);
};
