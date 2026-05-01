"use client";

import type { RefObject } from "react";

import { Message } from "./message";

/**
 * 会話ログの 1 件ぶんの正規化された行
 */
type Entry = {
  key: string;
  text: string;
  sentAt: string;
  clock: string;
  fromName: string;
  mine: boolean;
  hasMeta: boolean;
};

/**
 * ログ領域の入力を持つ
 */
type Log = {
  /** 自動スクロール用の参照 */
  logRef: RefObject<HTMLDivElement | null>;
  /** 1 件も無いときの案内文を出すかの判定 */
  empty: boolean;
  /** 表示対象の行一覧 */
  entries: Entry[];
};

/**
 * 通話ウィンドウ中央の 縦方向にスクロールする会話ログ
 * 空のときは静かな文言だけを表示し 新着到着は自動スクロールフックが末尾まで追従させる
 */
export const Log = ({ logRef, empty, entries }: Log) => (
  <div
    ref={logRef}
    className="scrollable flex max-h-[280px] min-h-[120px] flex-col gap-3 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,var(--paper)_24px)]"
  >
    {empty && <p className="self-center py-6 font-display text-ink-mute">なんでも、どうぞ</p>}
    {entries.map((entry) => (
      <Message
        key={entry.key}
        text={entry.text}
        sentAt={entry.sentAt}
        clock={entry.clock}
        fromName={entry.fromName}
        mine={entry.mine}
        hasMeta={entry.hasMeta}
      />
    ))}
  </div>
);
