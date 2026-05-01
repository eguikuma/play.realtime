"use client";

import type { CallId, MemberId } from "@play.realtime/contracts";
import { type SyntheticEvent, useRef, useState } from "react";

import { useRoom } from "@/features/room/store";
import { toHHMM } from "@/libraries/date";

import { useHallway } from "../store";
import { useActions } from "../use-actions";
import { useAutoscroll } from "../use-autoscroll";

type Call = {
  callId: CallId;
};

export const useCall = ({ callId }: Call) => {
  const me = useRoom((state) => state.me);
  const members = useRoom((state) => state.room?.members ?? []);
  const messages = useHallway((state) => state.messages[callId] ?? []);
  const actions = useActions();

  const [text, setText] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  useAutoscroll(ref, messages.length);

  const nameOf = (id: MemberId) => members.find((member) => member.id === id)?.name ?? "unknown";

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    actions.message(callId, trimmed);
    setText("");
  };

  const entries = messages.map((message, index) => {
    const previous = index > 0 ? messages[index - 1] : null;
    const mine = me !== null && message.fromMemberId === me.id;
    const hasMeta = !previous || previous.fromMemberId !== message.fromMemberId;
    return {
      key: `${message.sentAt}-${message.fromMemberId}-${message.text.length}`,
      text: message.text,
      sentAt: message.sentAt,
      clock: toHHMM(message.sentAt),
      fromName: mine ? "じぶん" : nameOf(message.fromMemberId),
      mine,
      hasMeta,
    };
  });

  return {
    ref,
    empty: messages.length === 0,
    entries,
    onLeave: () => actions.leave(callId),
    composer: {
      text,
      canSubmit: text.trim().length > 0,
      onChange: setText,
      onSubmit,
    },
  };
};
