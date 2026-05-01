"use client";

import type { RoomId } from "@play.realtime/contracts";
import { type SyntheticEvent, useState } from "react";

import { useMutations } from "../../use-mutations";

const MAX_LENGTH = 140;

type Compose = {
  roomId: RoomId;
  disabled: boolean;
};

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
