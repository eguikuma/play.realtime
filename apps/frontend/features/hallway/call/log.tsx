"use client";

import type { RefObject } from "react";

import { Message } from "./message";

type Entry = {
  /** React の `key` 属性に使う一意な文字列 */
  key: string;
  /** 本文テキスト */
  text: string;
  /** 送信時刻、ISO 8601 文字列、`<time>` の `dateTime` 属性に渡す */
  sentAt: string;
  /** 表示用の HH:MM 形式に整形した時刻 */
  clock: string;
  /** 発言者の表示名、自分の発言であれば「じぶん」を受け取る */
  fromName: string;
  /** 自分の発言かどうか、true のときは右寄せ / 暗い吹き出しに切り替える */
  mine: boolean;
  /** 同じ発言者の連投で 2 件目以降のヘッダ情報 (名前 / 時刻) を省略するときに false を渡す */
  hasMeta: boolean;
};

type Log = {
  /** スクロール位置制御のためのルート要素 ref、`useAutoscroll` が末尾に追従させる */
  ref: RefObject<HTMLDivElement | null>;
  /** メッセージが 1 件もないとき true、空状態のプレースホルダを表示する */
  empty: boolean;
  /** 表示するメッセージ一覧、`useCall` 側で整形済みの状態で受け取る */
  entries: Entry[];
};

/**
 * 通話窓のメッセージログ領域
 * 空のときは柔らかい誘導文、メッセージがあるときは `entries` を縦に並べる
 * 親 (`Call`) の max-h で総高が決まるので、ここは `flex-1 min-h-0` で残り領域を吸収して内側スクロールを担う
 */
export const Log = ({ ref, empty, entries }: Log) => (
  <div
    ref={ref}
    className="scrollable flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,var(--paper)_24px)]"
  >
    {empty && <p className="m-auto text-center font-display text-ink-mute">なんでも、どうぞ</p>}
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
