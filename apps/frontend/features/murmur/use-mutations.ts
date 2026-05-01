"use client";

import { Murmur, MurmurEndpoint, PostMurmurRequest, type RoomId } from "@play.realtime/contracts";

import { http } from "@/libraries/http-client";

/**
 * ひとこと投稿 HTTP を送る `post` 関数を返すフック
 * 失敗してもストアは触らず、SSE の `Posted` が真の最終状態として降ってくる前提で再送や楽観更新を行わない
 */
export const useMutations = (roomId: RoomId) => {
  const post = async (text: string) => {
    try {
      await http.post({
        endpoint: MurmurEndpoint.post(roomId),
        body: { text },
        request: PostMurmurRequest,
        response: Murmur,
      });
    } catch {
      /* SSE の最終状態が配信されるため、UI は直近の一覧を保持したままにする */
    }
  };

  return { post };
};
