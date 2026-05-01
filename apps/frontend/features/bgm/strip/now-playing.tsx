"use client";

import type { BgmCurrent } from "@play.realtime/contracts";

import type { Track } from "../tracks";

/**
 * 現在曲の表示で受け取る入力を持つ
 */
type NowPlaying = {
  /** 配信中の曲情報 何も流れていないときはなし */
  current: BgmCurrent | null;
  /** 曲名や演奏者を含むメタ情報 未解決の間はなし */
  track: Track | null;
};

/**
 * 帯表示の中央で 現在曲の曲名と演奏者を 1 行で表示する
 * 何も流れていないときは水平線を出し 視覚的なつなぎとする
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
