"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

export const useJoin = () => {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomId.trim();
    const candidate = trimmed.split(/[/?#]/).filter(Boolean).pop() ?? "";
    if (!/^[A-Za-z0-9_-]{10,}$/.test(candidate)) {
      toast.error("もらったリンクをそのまま貼り付けてみてください");
      return;
    }
    router.push(`/rooms/${candidate}`);
  };

  return {
    roomId,
    onChange: setRoomId,
    onSubmit,
  };
};
