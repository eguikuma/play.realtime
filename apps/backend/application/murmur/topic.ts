import type { MurmurTopic, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと機能の SSE と PubSub で使うトピック名を組み立てるヘルパ
 * `room:{roomId}:murmur` 形式で揃えることで `PubSub.closeByPrefix` がルーム閉鎖時にまとめて掃除できる
 * 戻り値は `MurmurTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 */
export const topic = (roomId: RoomId): MurmurTopic => `room:${roomId}:murmur` as MurmurTopic;
