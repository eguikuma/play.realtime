"use client";

import type { CallId, InvitationId } from "@play.realtime/contracts";

import { useHallway } from "./store";

/**
 * 廊下トークのクライアント側からサーバーへ送る操作群を 1 つのビューモデルにまとめるフック
 * 送信関数がなしのときは静かに何もしないことで 接続前の UI 誤操作を守る
 */
export const useActions = () => {
  const send = useHallway((state) => state.send);
  return {
    accept: (invitationId: InvitationId) => send?.("Accept", { invitationId }),
    decline: (invitationId: InvitationId) => send?.("Decline", { invitationId }),
    cancel: (invitationId: InvitationId) => send?.("Cancel", { invitationId }),
    message: (callId: CallId, text: string) => send?.("Send", { callId, text }),
    leave: (callId: CallId) => send?.("Leave", { callId }),
  };
};
