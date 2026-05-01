"use client";

import { BgmState, type RoomId, SetBgmRequest, type TrackId } from "@play.realtime/contracts";

import { http } from "@/libraries/http-client";

/**
 * BGM 変更系の API を呼び出す変更用フック
 * 失敗は握りつぶし SSE で届く最終状態に UI を委ねる方針とする
 */
export const useMutations = (roomId: RoomId) => {
  /**
   * 楽曲識別子を指定して BGM を切り替える
   */
  const set = async (trackId: TrackId) => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm`,
        body: { trackId },
        request: SetBgmRequest,
        response: BgmState,
      });
    } catch {
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
    }
  };

  /**
   * BGM を無音に切り替える
   */
  const stop = async () => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm/stop`,
        body: {},
        response: BgmState,
      });
    } catch {
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
    }
  };

  /**
   * 直前の BGM 変更を取り消す
   */
  const undo = async () => {
    try {
      await http.post({
        path: `/rooms/${roomId}/bgm/undo`,
        body: {},
        response: BgmState,
      });
    } catch {
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
    }
  };

  return { set, stop, undo };
};
