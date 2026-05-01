"use client";

import { type RoomId, VibeEndpoint, VibeEvents } from "@play.realtime/contracts";
import { useEffect } from "react";
import type { z } from "zod";
import { useRoom } from "@/features/room/store";
import { useConnectionStatus } from "@/libraries/connection-status/store";
import { origin } from "@/libraries/environment";
import { sse } from "@/libraries/sse-client";
import { useSse } from "@/libraries/transport";
import { useVibe } from "./store";

/**
 * Vibe SSE の購読を張り、受信イベントを `useVibe`、`useRoom`、`useConnectionStatus` に転写するフック
 * `roomId` が `null` のときは接続せず、ルーム画面に到達して入室済みになって初めて購読開始する
 * `handlers` の `satisfies` で `VibeEvents` 全件の網羅を型検査に委ね、イベント追加時の実装漏れを検出する
 */
export const useStream = (roomId: RoomId | null) => {
  const addMember = useRoom((state) => state.addMember);
  const setSnapshot = useVibe((state) => state.setSnapshot);
  const setStatus = useVibe((state) => state.setStatus);
  const remove = useVibe((state) => state.remove);
  const setConnectionId = useVibe((state) => state.setConnectionId);
  const setConnectionStatus = useConnectionStatus((store) => store.setStatus);

  const url = roomId ? `${origin}${VibeEndpoint.stream(roomId)}` : null;

  const handlers = {
    Welcome: ({ connectionId }) => setConnectionId(connectionId),
    Snapshot: ({ members, statuses }) => {
      for (const member of members) addMember(member);
      setSnapshot(statuses);
    },
    Joined: ({ member, status }) => {
      addMember(member);
      setStatus(member.id, status);
    },
    Left: ({ memberId }) => remove(memberId),
    Updated: ({ memberId, status }) => setStatus(memberId, status),
  } satisfies {
    [K in keyof typeof VibeEvents]: (payload: z.infer<(typeof VibeEvents)[K]>) => void;
  };

  const { state } = useSse({
    client: sse,
    url,
    events: VibeEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });

  useEffect(() => {
    setConnectionStatus("sse:vibe", state);
  }, [state, setConnectionStatus]);
};
