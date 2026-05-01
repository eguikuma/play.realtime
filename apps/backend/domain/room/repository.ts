import type { Room, RoomId } from "@play.realtime/contracts";

/**
 * ルームの永続化ポートを表す
 * ID ひとつを識別子として 保存と取得のみを担う
 */
export type RoomRepository = {
  save: (room: Room) => Promise<void>;
  find: (id: RoomId) => Promise<Room | null>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const RoomRepository = "RoomRepository" as const;
