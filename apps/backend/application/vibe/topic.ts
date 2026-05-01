import type { RoomId, VibeTopic } from "@play.realtime/contracts";

/**
 * Vibe 機能の SSE と PubSub で使うトピック名を組み立てるヘルパ
 * `room:{roomId}:vibe` 形式で揃えることで、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 * 戻り値は `VibeTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 */
export const topic = (roomId: RoomId): VibeTopic => `room:${roomId}:vibe` as VibeTopic;
