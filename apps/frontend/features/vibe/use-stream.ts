"use client";

import { type RoomId, VibeEvents } from "@play.realtime/contracts";
import type { z } from "zod";

import { useRoom } from "@/features/room/store";
import { sse } from "@/libraries/clients";
import { origin } from "@/libraries/environment";
import { useSse } from "@/libraries/transport";

import { useVibe } from "./store";

/**
 * 空気の SSE 購読を張り `Welcome` `Snapshot` `Joined` `Left` `Update` をストアへ転写するフック
 * `Joined` とスナップショット経由でルーム側のメンバー一覧にも差分追加し UI の顔表示欠落を防ぐ
 */
export const useStream = (roomId: RoomId | null) => {
  const addMember = useRoom((state) => state.addMember);
  const setSnapshot = useVibe((state) => state.setSnapshot);
  const setStatus = useVibe((state) => state.setStatus);
  const remove = useVibe((state) => state.remove);
  const setConnectionId = useVibe((state) => state.setConnectionId);

  const url = roomId ? `${origin}/rooms/${roomId}/vibe/stream` : null;

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
    Update: ({ memberId, status }) => setStatus(memberId, status),
  } satisfies {
    [K in keyof typeof VibeEvents]: (payload: z.infer<(typeof VibeEvents)[K]>) => void;
  };

  useSse({
    client: sse,
    url,
    events: VibeEvents,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });
};
