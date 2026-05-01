import type { BgmTopic, RoomId } from "@play.realtime/contracts";

/**
 * BGM 機能の SSE と PubSub で使うトピックを組み立てるヘルパ束
 * `Topic.room(roomId)` で `room:{roomId}:bgm` 形式のルーム単位トピックを返し、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 * 戻り値は `BgmTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 */
export const Topic = {
  room: (roomId: RoomId): BgmTopic => `room:${roomId}:bgm` as BgmTopic,
} as const;
