"use client";

import type { MemberId, RoomId } from "@play.realtime/contracts";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSession } from "@/stores/session";
import { useBgm } from "../store";
import { Tracks } from "../tracks";
import { useDismiss } from "../use-dismiss";
import { useMutations } from "../use-mutations";
import { usePlayer } from "../use-player";
import { useStream } from "../use-stream";

/**
 * 画面下部の BGM ストリップに必要な状態、音声制御、undo バナー要否を集約するフック
 * SSE 購読、`<audio>` 制御、パネル開閉の外クリック解除、undo バナーの表示判定をまとめ、コンポーネント側は返り値を並べるだけにする
 * undo バナーは操作者本人には出さず、`undoable.byMemberId !== me.id` のときだけ表示する、自分でやり直す場合は undo ではなく再度 `set` や `stop` を促す設計に沿わせる
 */
export const useStrip = (roomId: RoomId) => {
  const me = useSession((state) => state.me);
  const members = useSession((state) => state.room?.members ?? []);
  const state = useBgm((state) => state.state);

  useStream(me ? roomId : null);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  useDismiss(ref, open, close);

  const current = state.current;
  const track = useMemo(() => (current ? Tracks[current.trackId] : null), [current]);
  const src = track?.src ?? null;
  const gain = track?.gain ?? 1;

  const player = usePlayer(src, gain);
  const mutations = useMutations(roomId);

  const active = current !== null;
  const isPlaying = active && !player.paused && !player.loading;
  const isBuffering = player.loading && !player.paused;
  const isPaused = player.paused && active;

  const nameOf = useCallback(
    (memberId: MemberId) => members.find((member) => member.id === memberId)?.name ?? "unknown",
    [members],
  );

  const { undoable } = state;
  const undoableForMe =
    undoable !== null && me !== null && undoable.byMemberId !== me.id ? undoable : null;

  return {
    roomId,
    ref,
    open,
    toggle,
    close,
    audio: {
      ref: player.ref,
      src,
      onPlaying: player.handlers.onPlaying,
      onCanPlay: player.handlers.onCanPlay,
      onWaiting: player.handlers.onWaiting,
      onError: player.handlers.onError,
    },
    shell: { active },
    lead: { idle: !current, buffering: isBuffering, paused: isPaused, playing: isPlaying },
    nowPlaying: { current, track },
    controls: {
      active,
      paused: player.paused,
      volume: player.volume,
      onPlay: player.play,
      onPause: player.pause,
      onVolume: player.setVolume,
    },
    undoBanner: undoableForMe
      ? {
          until: undoableForMe.until,
          byName: nameOf(undoableForMe.byMemberId),
          onUndo: mutations.undo,
        }
      : null,
  };
};
