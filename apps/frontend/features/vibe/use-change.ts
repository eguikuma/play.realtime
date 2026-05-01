"use client";

import {
  ChangeVibeStatusRequest,
  type RoomId,
  VibeEndpoint,
  type VibeStatus,
} from "@play.realtime/contracts";
import { z } from "zod";

import { http } from "@/libraries/http-client";

import { useVibe } from "./store";

/**
 * クライアントの可視状態変化をサーバへ POST する送信関数を返すフック
 * `Welcome` 未着で `connectionId` が未確定の間は送信を抑止する、HTTP 失敗時は次回の可視状態変化でまた送るため無視する
 */
export const useChange = (roomId: RoomId) => {
  const connectionId = useVibe((state) => state.connectionId);

  return async (status: VibeStatus) => {
    if (!connectionId) return;
    try {
      await http.post({
        endpoint: VibeEndpoint.change(roomId),
        body: { connectionId, status },
        request: ChangeVibeStatusRequest,
        response: z.unknown(),
      });
    } catch {
      /* 次の可視状態変化で再送されるため、ここでは無視する */
    }
  };
};
