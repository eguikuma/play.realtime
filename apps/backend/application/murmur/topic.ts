import type { MurmurTopic, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと機能の SSE と PubSub で使うトピックを組み立てるヘルパ束
 * `Topic.room(roomId)` で `room:{roomId}:murmur` 形式のルーム単位トピックを返し、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 * 戻り値は `MurmurTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 */
export const Topic = {
  room: (roomId: RoomId): MurmurTopic => `room:${roomId}:murmur` as MurmurTopic,
} as const;
