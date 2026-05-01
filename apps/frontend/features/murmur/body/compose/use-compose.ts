"use client";

import type { RoomId } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";

import { useMutations } from "../../use-mutations";

/**
 * ひとこと 1 件の最大文字数
 * サーバー側の投稿リクエストの上限と揃え UI 側でも事前に切り詰める
 */
const MAX_LENGTH = 140;

/**
 * 投稿フックの入力
 */
type Compose = {
  roomId: RoomId;
  disabled: boolean;
};

/**
 * 投稿欄のビューモデルを組み立てるフック
 * 入力値を上限で丸め 残り文字数や警告しきい値や送信状態をまとめて返す
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
