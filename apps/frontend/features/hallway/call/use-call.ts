"use client";

import type { CallId, MemberId } from "@play.realtime/contracts";
import { type SyntheticEvent, useRef, useState } from "react";

import { useRoom } from "@/features/room/store";

import { useHallway } from "../store";
import { useActions } from "../use-actions";
import { useAutoscroll } from "../use-autoscroll";

/**
 * ISO 形式の日時を「時 分」の 2 桁表現に整える
 */
const formatClock = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/**
 * 通話フックの入力
 */
type Call = {
  callId: CallId;
};

/**
 * 通話ウィンドウのビューモデルを組み立てるフック
 * メッセージ一覧の 自分のものか 送信者情報の表示要否 時刻文字列を 事前に計算して子部品に渡す
 */
export const useCall = ({ callId }: Call) => {
  const me = useRoom((state) => state.me);
  const members = useRoom((state) => state.room?.members ?? []);
  const messages = useHallway((state) => state.messages[callId] ?? []);
  const actions = useActions();

  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  useAutoscroll(logRef, messages.length);

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
      clock: formatClock(message.sentAt),
      fromName: mine ? "じぶん" : nameOf(message.fromMemberId),
      mine,
      hasMeta,
    };
  });

  return {
    logRef,
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
