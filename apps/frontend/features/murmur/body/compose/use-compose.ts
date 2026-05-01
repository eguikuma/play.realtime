"use client";

import type { RoomId } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";
import { useSession } from "@/stores/session";
import { useMutations } from "../../use-mutations";

/**
 * 投稿本文の上限文字数、`Murmur.text` スキーマの上限に揃えてサーバとクライアントの検証範囲を合わせる
 */
const MAX_LENGTH = 140;

type Compose = {
  roomId: RoomId;
};

/**
 * 投稿フォームの状態と送信処理をまとめたフック
 * 文字数カウンタの残りと警告閾値、送信中フラグによる二重送信防止、submit 成功時の入力クリアまでを 1 本で面倒見る
 * 未入室 (me が null) のときは投稿を受け付けないので、入力欄と送信経路を内部で止める
 */
export const useCompose = ({ roomId }: Compose) => {
  const me = useSession((state) => state.me);
  const mutations = useMutations(roomId);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const unjoined = me === null;
  const remaining = MAX_LENGTH - text.length;
  const warn = remaining <= 14;

  const onChange = (value: string) => {
    setText(value.slice(0, MAX_LENGTH));
  };

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || unjoined) return;

    setSubmitting(true);
    try {
      await mutations.post(trimmed);
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    text,
    maxLength: MAX_LENGTH,
    remaining,
    warn,
    disabled: unjoined || submitting,
    onChange,
    onSubmit,
  };
};
