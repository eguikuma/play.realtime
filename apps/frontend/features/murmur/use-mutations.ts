"use client";

import { Murmur, PostMurmurRequest, type RoomId } from "@play.realtime/contracts";

import { http } from "@/libraries/http-client";

/**
 * ひとこと投稿の変更用フック
 * 失敗は握りつぶし SSE で届く最終一覧を UI の正解として扱う
 */
export const useMutations = (roomId: RoomId) => {
  const post = async (text: string) => {
    try {
      await http.post({
        path: `/rooms/${roomId}/murmurs`,
        body: { text },
        request: PostMurmurRequest,
        response: Murmur,
      });
    } catch {
      /* SSE で最終状態が配信されるため UI は直近の一覧を保持したままとする */
    }
  };

  return { post };
};
