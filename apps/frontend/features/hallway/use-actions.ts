"use client";

import type { CallId, InvitationId } from "@play.realtime/contracts";

import { useHallway } from "./store";

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
