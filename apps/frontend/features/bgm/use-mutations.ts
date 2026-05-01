"use client";

import { BgmState, type RoomId, SetBgmRequest, type TrackId } from "@play.realtime/contracts";

import { http } from "@/libraries/http-client";

/**
 * BGM の再生 / 停止 / undo を送る HTTP 関数群を返すフック
 * いずれの操作も失敗しても UI ストアは触らず、サーバ側の SSE `Changed` 配信が真の最終状態として降ってくる前提で再送や楽観更新を行わない
 */
export const useMutations = (roomId: RoomId) => {
  const set = async (trackId: TrackId) => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm`,
        body: { trackId },
        request: SetBgmRequest,
        response: BgmState,
      });
    } catch {
      /* SSE の最終状態が配信されるため、UI は直近のスナップショットを保持したままにする */
    }
  };

  const stop = async () => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm/stop`,
        body: {},
        response: BgmState,
      });
    } catch {
      /* SSE の最終状態が配信されるため、UI は直近のスナップショットを保持したままにする */
    }
  };

  const undo = async () => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm/undo`,
        body: {},
        response: BgmState,
      });
    } catch {
      /* SSE の最終状態が配信されるため、UI は直近のスナップショットを保持したままにする */
    }
  };

  return { set, stop, undo };
};
