"use client";

import type { RefObject } from "react";

import { Message } from "./message";

type Entry = {
  key: string;
  text: string;
  sentAt: string;
  clock: string;
  fromName: string;
  mine: boolean;
  hasMeta: boolean;
};

type Log = {
  ref: RefObject<HTMLDivElement | null>;

  empty: boolean;

  entries: Entry[];
};

export const Log = ({ ref, empty, entries }: Log) => (
  <div
    ref={ref}
    className="scrollable flex max-h-[280px] min-h-[120px] flex-col gap-3 overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,transparent,var(--paper)_24px)]"
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
