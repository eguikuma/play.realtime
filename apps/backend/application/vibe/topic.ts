import type { RoomId } from "@play.realtime/contracts";

/**
 * 空気の配信で使うパブリッシュ購読のトピック名を組み立てる
 * ルームごとに独立したチャネルとし 他ルームの空気変化が誤って混ざらないようにする
 */
export const topic = (roomId: RoomId): string => `room:${roomId}:vibe`;
