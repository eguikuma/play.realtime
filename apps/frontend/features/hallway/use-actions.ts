"use client";

import type { CallId, InvitationId } from "@play.realtime/contracts";

import { useHallway } from "./store";

/**
 * 廊下トークのクライアント発コマンドを薄くラップしたアクション集を返すフック
 * 未接続で `send` が `null` の間は各アクションが no-op になり、切断中のボタン操作が静かに捨てられる
 * サーバ側の認可や状態確認は WebSocket 経由で行われ、UI はコマンドを投げるだけに集中する
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
