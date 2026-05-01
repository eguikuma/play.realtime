"use client";

import type { TrackId } from "@play.realtime/contracts";
import { AudioLines } from "lucide-react";

import type { Track } from "../tracks";
import { Entry } from "./entry";

type Library = {
  /** パネルに並べる全ての選曲候補、契約の `TrackIds` 全件に対応する 1 件ずつで構成する */
  entries: {
    /** 各エントリを識別するキー、`key` 属性にも使う */
    trackId: TrackId;
    /** 表示に使うフロントエンドのメタデータ */
    track: Track;
    /** この曲が現在鳴っているかどうか */
    tuned: boolean;
    /** この曲を選んだときに親へ通知するコールバック */
    onSelect: () => void;
  }[];
};

/**
 * 選曲パネル下段のライブラリ一覧
 * `entries` を縦に並べてスクロールできるようにし、1 件ずつ `Entry` に委ねる
 * 親の `Panel` が max-h を固定しているので、ここは `flex-1 min-h-0` で残り領域を吸収して内側スクロールを担う
 */
export const Library = ({ entries }: Library) => (
  <section className="flex min-h-0 flex-1 flex-col gap-2">
    <header className="flex items-center gap-2 text-ink-mute">
      <AudioLines aria-hidden className="size-3.5" />
      <span className="font-bold font-display text-[12px] tracking-wider">ライブラリ</span>
    </header>

    <ul className="scrollable flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {entries.map((entry) => (
        <li key={entry.trackId}>
          <Entry track={entry.track} tuned={entry.tuned} onSelect={entry.onSelect} />
        </li>
      ))}
    </ul>
  </section>
);
