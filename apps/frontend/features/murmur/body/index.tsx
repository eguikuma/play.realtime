"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Compose } from "./compose";
import { Empty } from "./empty";
import { Entry } from "./entry";
import { useBody } from "./use-body";

/**
 * ひとこと本体の最上位セクション
 * 上部の投稿欄と本文一覧を積み重ね 何もないときは案内文に切り替える
 */
export const MurmurBody = ({ roomId }: { roomId: RoomId }) => {
  const body = useBody(roomId);

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <Compose roomId={body.roomId} disabled={body.composeDisabled} />

      {body.empty ? (
        <Empty />
      ) : (
        <ol className="scrollable flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-2 pr-2 pb-4">
          {body.entries.map((entry) => (
            <li key={entry.murmur.id}>
              <Entry murmur={entry.murmur} authorName={entry.authorName} fresh={entry.fresh} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
