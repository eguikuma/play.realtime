"use client";

import type {
  Call,
  CallId,
  CallMessage,
  ConnectionId,
  HallwaySnapshot,
  Invitation,
  InvitationId,
} from "@play.realtime/contracts";
import { create } from "zustand";

type Sender = <TData>(name: string, data: TData) => void;

type HallwayState = {
  connectionId: ConnectionId | null;
  invitations: Record<string, Invitation>;
  calls: Record<string, Call>;
  messages: Record<string, CallMessage[]>;
  send: Sender | null;
  setConnectionId: (connectionId: ConnectionId | null) => void;
  setSend: (send: Sender | null) => void;
  setSnapshot: (snapshot: HallwaySnapshot) => void;
  addInvitation: (invitation: Invitation) => void;
  removeInvitation: (invitationId: InvitationId) => void;
  addCall: (call: Call) => void;
  removeCall: (callId: CallId) => void;
  appendMessage: (message: CallMessage) => void;
};

/**
 * 廊下トークの状態と WebSocket 送信ハンドルを集約する zustand ストア
 * 招待、通話、通話ごとのメッセージ配列を ID キーのマップで保持し、`send` は接続中だけ値を持ち切断時に `null` へ戻す
 * `setSnapshot` は購読開始直後の全置換、`addCall` は通話開始時にメッセージ配列を空で作成、`removeCall` は終了時にメッセージもまとめて破棄する
 */
export const useHallway = create<HallwayState>()((set) => ({
  connectionId: null,
  invitations: {},
  calls: {},
  messages: {},
  send: null,
  setConnectionId: (connectionId) => set({ connectionId }),
  setSend: (send) => set({ send }),
  setSnapshot: (snapshot) =>
    set({
      invitations: Object.fromEntries(snapshot.invitations.map((entry) => [entry.id, entry])),
      calls: Object.fromEntries(snapshot.calls.map((entry) => [entry.id, entry])),
      messages: {},
    }),
  addInvitation: (invitation) =>
    set((state) => ({
      invitations: { ...state.invitations, [invitation.id]: invitation },
    })),
  removeInvitation: (invitationId) =>
    set((state) => {
      const next = { ...state.invitations };
      delete next[invitationId];
      return { invitations: next };
    }),
  addCall: (call) =>
    set((state) => ({
      calls: { ...state.calls, [call.id]: call },
      messages: { ...state.messages, [call.id]: [] },
    })),
  removeCall: (callId) =>
    set((state) => {
      const nextCalls = { ...state.calls };
      delete nextCalls[callId];
      const nextMessages = { ...state.messages };
      delete nextMessages[callId];
      return { calls: nextCalls, messages: nextMessages };
    }),
  appendMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.callId]: [...(state.messages[message.callId] ?? []), message],
      },
    })),
}));
