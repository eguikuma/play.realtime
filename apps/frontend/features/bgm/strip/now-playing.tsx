"use client";

import type { BgmCurrent } from "@play.realtime/contracts";

import type { Track } from "../tracks";

type NowPlaying = {
  /** サーバから配信されている再生中の曲情報、無音のときは null */
  current: BgmCurrent | null;
  /** `current.trackId` に対応するフロントエンドのメタデータ、未解決のときは null */
  track: Track | null;
};

/**
 * ストリップの中央に置くタイトル表示領域
 * 曲が選ばれているときは曲名とアーティスト名を 1 行に並べ、無音のときは横の細い罫線だけを表示する
 */
export const NowPlaying = ({ current, track }: NowPlaying) => (
  <div className="relative flex min-w-0 flex-1 items-center">
    {current && track ? (
      <span className="flex min-w-0 items-baseline gap-2 font-display text-[14px] text-ink">
        <span className="min-w-0 truncate">
          <span className="font-medium">{track.title}</span>
          <span className="ml-2 text-ink-soft">{track.artist}</span>
        </span>
      </span>
    ) : (
      <span aria-hidden className="h-px flex-1 bg-rule/60" />
    )}
  </div>
);
