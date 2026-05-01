"use client";

import { ChangeVibeStatusRequest, type RoomId, type VibeStatus } from "@play.realtime/contracts";
import { z } from "zod";

import { http } from "@/libraries/http-client";

import { useVibe } from "./store";

/**
 * タブの見え方の変化をサーバーに通知する送信関数を返すフック
 * 接続 ID が解決していない間は何もせず 接続成立前の無用な送信を抑える
 * 失敗は握りつぶし 次の変化で再試行させる
 */
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
