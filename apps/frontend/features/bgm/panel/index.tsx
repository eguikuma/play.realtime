"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Library } from "./library";
import { NowPlaying } from "./now-playing";
import { usePanel } from "./use-panel";

type Panel = {
  /** パネルが対象とするルーム ID、選曲操作の送信先になる */
  roomId: RoomId;
  /** 選曲 / 停止が確定したときにパネルを閉じるためのコールバック */
  onClose: () => void;
};

/**
 * ストリップから開く選曲パネル
 * 上段に再生中の情報、下段にライブラリの曲一覧を置き、選曲か停止が確定すると `onClose` で自身を閉じる
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
