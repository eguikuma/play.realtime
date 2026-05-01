import type { RoomId } from "@play.realtime/contracts";

/**
 * BGM 機能の SSE と PubSub で使うトピック名を組み立てるヘルパ
 * `room:{roomId}:bgm` 形式で揃えることで、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 */
export const topic = (roomId: RoomId): string => `room:${roomId}:bgm`;
