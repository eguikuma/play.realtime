import type { BgmTopic, RoomId } from "@play.realtime/contracts";

/**
 * BGM 機能の SSE と PubSub で使うトピック名を組み立てるヘルパ
 * `room:{roomId}:bgm` 形式で揃えることで、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 * 戻り値は `BgmTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 */
export const topic = (roomId: RoomId): BgmTopic => `room:${roomId}:bgm` as BgmTopic;
