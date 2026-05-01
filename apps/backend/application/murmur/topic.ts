import type { RoomId } from "@play.realtime/contracts";

/**
 * ひとこと投稿の配信で使うパブリッシュ購読のトピック名を組み立てる
 * ルームごとに独立したチャネルとし 他ルームの投稿が誤って混ざらないようにする
 */
export const topic = (roomId: RoomId): string => `room:${roomId}:murmur`;
