import type { Murmur, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと投稿の永続化ポートを表す
 * 保存は 1 件ずつ積み 取得はルーム単位で最新の指定件数を時刻降順で返す
 */
export type MurmurRepository = {
  /**
   * ひとこと投稿を 1 件追加する
   */
  save: (murmur: Murmur) => Promise<void>;
  /**
   * 指定ルームの直近の投稿を 到着順のまま指定件数ぶん返す
   */
  latest: (roomId: RoomId, limit: number) => Promise<Murmur[]>;
  /**
   * 指定ルームのひとこと投稿を台帳から取り除く
   * 既に存在しない場合も冪等に無視する
   */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const MurmurRepository = "MurmurRepository" as const;
