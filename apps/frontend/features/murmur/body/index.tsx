"use client";

import type { RoomId } from "@play.realtime/contracts";

import { Empty } from "./empty";
import { Entry } from "./entry";
import { useBody } from "./use-body";

type MurmurBody = {
  /** 表示対象のルーム ID、SSE 購読と投稿 API の宛先に使う */
  roomId: RoomId;
};

/**
 * ルーム画面のひとこと一覧領域
 * 親グリッドの可変 1 行 (`minmax(0,1fr)`) に置かれ、自身は内部スクロールだけを担当する
 * 投稿が 0 件のときは空状態メッセージ、1 件以上のときは投稿リストを描画する
 */
export const MurmurBody = ({ roomId }: MurmurBody) => {
  const body = useBody(roomId);

  return (
    <div className="scrollable h-full min-h-0 overflow-y-auto pt-2 pr-2 pb-4">
      {body.empty ? (
        <Empty />
      ) : (
        <ol className="flex flex-col gap-6">
          {body.entries.map((entry) => (
            <li key={entry.murmur.id}>
              <Entry murmur={entry.murmur} authorName={entry.authorName} fresh={entry.fresh} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export { Compose } from "./compose";
