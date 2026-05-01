"use client";

import { BgmState, type RoomId, SetBgmRequest, type TrackId } from "@play.realtime/contracts";

import { http } from "@/libraries/http-client";

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
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
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
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
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
      /* SSE で最終状態が配信されるため UI は直近のスナップショットを保持したままとする */
    }
  };

  return { set, stop, undo };
};
