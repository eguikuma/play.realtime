"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Compose } from "./compose";
import { Empty } from "./empty";
import { Entry } from "./entry";
import { useBody } from "./use-body";

type MurmurBody = {
  /** 表示対象のルーム ID、SSE 購読と投稿 API の宛先に使う */
  roomId: RoomId;
};

/**
 * ルーム画面中央のひとことパネル
 * 上部に投稿フォーム、下部に投稿一覧を並べ、投稿が 1 件もないときは空状態メッセージを出す
 */
export const MurmurBody = ({ roomId }: MurmurBody) => {
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
