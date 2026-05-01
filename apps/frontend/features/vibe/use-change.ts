"use client";

import { ChangeVibeStatusRequest, type RoomId, type VibeStatus } from "@play.realtime/contracts";
import { z } from "zod";

import { http } from "@/libraries/http-client";

import { useVibe } from "./store";

export const useChange = (roomId: RoomId) => {
  const connectionId = useVibe((state) => state.connectionId);

  return async (status: VibeStatus) => {
    if (!connectionId) return;
    try {
      await http.post({
        path: `/rooms/${roomId}/vibe`,
        body: { connectionId, status },
        request: ChangeVibeStatusRequest,
        response: z.unknown(),
      });
    } catch {
      /* 次の見え方変化で再送されるため ここでは握りつぶす */
    }
  };
};
