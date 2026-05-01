import type { RoomId } from "@play.realtime/contracts";

/**
 * Vibe 機能の SSE / PubSub トピック名を組み立てるヘルパ
 * `room:{roomId}:vibe` 形式で揃えることで、ルーム閉鎖時に `PubSub.closeByPrefix` がまとめて掃除できる
 */
export const topic = (roomId: RoomId): string => `room:${roomId}:vibe`;
