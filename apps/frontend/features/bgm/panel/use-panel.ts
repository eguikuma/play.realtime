"use client";

import type { MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import { TrackIds } from "@play.realtime/contracts";

import { useRoom } from "@/features/room/store";

import { useBgm } from "../store";
import { Tracks } from "../tracks";
import { useMutations } from "../use-mutations";

type Panel = {
  roomId: RoomId;
  onClose: () => void;
};

/**
 * BGM 選曲パネルに必要な描画データと操作ハンドラを組み立てるフック
 * 選曲または停止を実行すると即座に `onClose` でパネルを閉じ、以降の描画は SSE `Changed` の配信に委ねる
 */
export const usePanel = ({ roomId, onClose }: Panel) => {
  const members = useRoom((state) => state.room?.members ?? []);
  const state = useBgm((state) => state.state);
  const mutations = useMutations(roomId);

  const current = state.current;
  const track = current ? Tracks[current.trackId] : null;

  const nameOf = (id: MemberId) => members.find((member) => member.id === id)?.name ?? "unknown";

  const onSelect = async (trackId: TrackId) => {
    await mutations.set(trackId);
    onClose();
  };

  const onStop = async () => {
    await mutations.stop();
    onClose();
  };

  const library = TrackIds.map((trackId) => ({
    trackId,
    track: Tracks[trackId],
    tuned: current?.trackId === trackId,
    onSelect: () => onSelect(trackId),
  }));

  return {
    nowPlaying: {
      current,
      track,
      byName: current ? nameOf(current.setBy) : null,
      onStop,
    },
    library,
  };
};
