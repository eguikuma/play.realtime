import type { Murmur, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと投稿の永続化ポートを表す
 * 保存は 1 件ずつ積み 取得はルーム単位で最新の指定件数を時刻降順で返す
 */
export type MurmurRepository = {
  save: (murmur: Murmur) => Promise<void>;
  latest: (roomId: RoomId, limit: number) => Promise<Murmur[]>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const MurmurRepository = "MurmurRepository" as const;
