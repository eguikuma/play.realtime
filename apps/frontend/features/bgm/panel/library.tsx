"use client";

import type { TrackId } from "@play.realtime/contracts";
import { AudioLines } from "lucide-react";

import type { Track } from "../tracks";
import { Entry } from "./entry";

/**
 * ライブラリ欄に渡す 10 曲ぶんの行データを持つ
 */
type Library = {
  entries: {
    trackId: TrackId;
    track: Track;
    /** 現在再生中の行として目立たせるかを示す */
    tuned: boolean;
    onSelect: () => void;
  }[];
};

/**
 * パネル下段に置く選曲ライブラリ
 * 10 曲を縦並びで並べ 現在選曲中の 1 件を視覚的に際立たせる
 */
export const Library = ({ entries }: Library) => (
  <section className="flex flex-col gap-2">
    <header className="flex items-center gap-2 text-ink-mute">
      <AudioLines aria-hidden className="size-3.5" />
      <span className="font-bold font-display text-[12px] tracking-wider">ライブラリ</span>
    </header>

    <ul className="scrollable flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
      {entries.map((entry) => (
        <li key={entry.trackId}>
          <Entry track={entry.track} tuned={entry.tuned} onSelect={entry.onSelect} />
        </li>
      ))}
    </ul>
  </section>
);
