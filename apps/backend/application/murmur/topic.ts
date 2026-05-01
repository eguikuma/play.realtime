import type { RoomId } from "@play.realtime/contracts";

/**
 * ひとこと機能の SSE / PubSub トピック名を組み立てるヘルパ
 * `room:{roomId}:murmur` 形式で揃えることで `PubSub.closeByPrefix` がルーム閉鎖時にまとめて掃除できる
 */
export const topic = (roomId: RoomId): string => `room:${roomId}:murmur`;
