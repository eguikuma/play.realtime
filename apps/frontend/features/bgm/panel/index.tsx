"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Library } from "./library";
import { NowPlaying } from "./now-playing";
import { usePanel } from "./use-panel";

/**
 * パネルの入力として受け取るルーム ID と閉じるためのコールバック
 */
type Panel = {
  roomId: RoomId;
  onClose: () => void;
};

/**
 * ストリップから展開する選曲ポップオーバーの最上位
 * 現在曲の欄とライブラリ欄を縦並びで並べる
 */
export const Panel = ({ roomId, onClose }: Panel) => {
  const panel = usePanel({ roomId, onClose });

  return (
    <div className="flex w-[360px] max-w-[calc(100vw-48px)] flex-col gap-5 rounded-md border border-rule bg-paper/95 p-4 shadow-[0_16px_36px_-22px_oklch(from_var(--ink)_l_c_h/0.3)]">
      <NowPlaying {...panel.nowPlaying} />
      <Library entries={panel.library} />
    </div>
  );
};
