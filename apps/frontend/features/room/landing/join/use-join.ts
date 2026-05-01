"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

/**
 * 既存ルームの ID だけを入力して遷移する簡易ビューモデル
 * ID の正規表現検証をクライアント側でも掛け URL として安全に開けるかを事前に確かめる
 * 検証に外れた入力は Sonner のトーストで指摘し レイアウトを揺らさない
 */
export const useJoin = () => {
  const router = useRouter();

  const [roomId, setRoomId] = useState("");

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomId.trim();
    if (!/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
      toast.error("URL に含まれるルーム ID を貼り付けてください");
      return;
    }
    router.push(`/rooms/${trimmed}`);
  };

  return {
    roomId,
    onChange: setRoomId,
    onSubmit,
  };
};
