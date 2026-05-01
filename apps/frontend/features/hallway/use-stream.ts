"use client";

import { HallwayServerMessages, type RoomId } from "@play.realtime/contracts";
import { useEffect } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { useConnectionStatus } from "@/libraries/connection-status/store";
import { wsOrigin } from "@/libraries/environment";
import { useWs } from "@/libraries/transport/ws";
import { ws } from "@/libraries/ws-client";

import { hallwayErrorMessages } from "./errors";
import { useHallway } from "./store";

/**
 * 廊下トークの WebSocket 購読を張り、受信イベントをストアへ転写するフック
 * `CommandFailed` は自分宛の rejected 通知として扱い、`hallwayErrorMessages` 経由で Sonner トーストに中継する
 * 切断時クリーンアップで `send` を `null` に戻し、`connectionId` もリセットして「接続なし」の状態を明示する
 */
export const useStream = (roomId: RoomId | null) => {
  const setConnectionId = useHallway((state) => state.setConnectionId);
  const setSend = useHallway((state) => state.setSend);
  const setSnapshot = useHallway((state) => state.setSnapshot);
  const addInvitation = useHallway((state) => state.addInvitation);
  const removeInvitation = useHallway((state) => state.removeInvitation);
  const addCall = useHallway((state) => state.addCall);
  const removeCall = useHallway((state) => state.removeCall);
  const appendMessage = useHallway((state) => state.appendMessage);
  const setStatus = useConnectionStatus((state) => state.setStatus);

  const url = roomId ? `${wsOrigin}/rooms/${roomId}/hallway` : null;

  const handlers = {
    Welcome: ({ connectionId }) => setConnectionId(connectionId),
    Snapshot: (snapshot) => setSnapshot(snapshot),
    Invited: ({ invitation }) => addInvitation(invitation),
    InvitationEnded: ({ invitationId }) => removeInvitation(invitationId),
    CallStarted: ({ call }) => addCall(call),
    Message: ({ message }) => appendMessage(message),
    CallEnded: ({ callId }) => removeCall(callId),
    CommandFailed: ({ code }) => toast.error(hallwayErrorMessages[code]),
  } satisfies {
    [K in keyof typeof HallwayServerMessages]: (
      payload: z.infer<(typeof HallwayServerMessages)[K]>,
    ) => void;
  };

  const { state, send } = useWs({
    client: ws,
    url,
    events: HallwayServerMessages,
    onEvent: (name, payload) => {
      (handlers[name] as (value: unknown) => void)(payload);
    },
  });

  useEffect(() => {
    setStatus("ws:hallway", state);
  }, [state, setStatus]);

  useEffect(() => {
    if (!url) {
      setSend(null);
      return;
    }
    setSend(send);
    return () => {
      setSend(null);
      setConnectionId(null);
    };
  }, [url, send, setSend, setConnectionId]);
};
