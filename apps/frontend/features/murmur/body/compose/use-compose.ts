"use client";

import type { RoomId } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";

import { useMutations } from "../../use-mutations";

/**
 * 投稿本文の上限文字数、`Murmur.text` スキーマの上限に揃えてサーバ / クライアントの検証範囲を合わせる
 */
const MAX_LENGTH = 140;

type Compose = {
  roomId: RoomId;
  disabled: boolean;
};

/**
 * 投稿フォームの状態と送信処理をまとめたフック
 * 文字数カウンタの残り / 警告閾値、送信中フラグによる二重送信防止、submit 成功時の入力クリアまでを 1 本で面倒見る
 */
export const useCompose = ({ roomId, disabled }: Compose) => {
  const mutations = useMutations(roomId);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const remaining = MAX_LENGTH - text.length;
  const warn = remaining <= 14;

  const onChange = (value: string) => {
    setText(value.slice(0, MAX_LENGTH));
  };

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

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
    disabled: disabled || submitting,
    onChange,
    onSubmit,
  };
};
