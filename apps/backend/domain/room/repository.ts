import type { Room, RoomId } from "@play.realtime/contracts";

/**
 * ルームの永続化ポートを表す
 * ID ひとつを識別子として 保存 取得 破棄を担う
 */
export type RoomRepository = {
  /**
   * ルームを新規登録するか 同じ ID の内容で上書き保存する
   */
  save: (room: Room) => Promise<void>;
  /**
   * 指定 ID のルームを返し 未登録ならなしを返す
   */
  find: (id: RoomId) => Promise<Room | null>;
  /**
   * 指定ルームを台帳から取り除く
   * 存在しない場合は冪等に無視する
   */
  remove: (id: RoomId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const RoomRepository = "RoomRepository" as const;
