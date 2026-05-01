"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";

/**
 * 既存ルームへの遷移を組み立てる簡易ビューモデル
 * 入力はルーム ID 単体と リンク全体のどちらでも受け取り 末尾セグメントを取り出してから形を検証する
 * 検証に外れた入力は Sonner のトーストで指摘し レイアウトを揺らさない
 */
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
