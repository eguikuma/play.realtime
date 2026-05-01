import type { Murmur, RoomId } from "@play.realtime/contracts";

/**
 * ひとこと永続化の port 型
 * ルーム単位で投稿履歴を管理し、購読開始時の `Snapshot` 配信と投稿追加を両立できる API を持つ
 */
export type MurmurRepository = {
  /** 投稿 1 件を追加する、重複する `id` が来た場合の挙動は実装に委ねる */
  save: (murmur: Murmur) => Promise<void>;
  /** 指定ルームの最新順で `limit` 件までの投稿を取得する、配列は古い順に並べ替えて返す前提 */
  latest: (roomId: RoomId, limit: number) => Promise<Murmur[]>;
  /** 指定ルームに属する全投稿を削除する、ルーム閉鎖時のクリーンアップで使う */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * `MurmurRepository` 型と同名の DI トークン
 * NestJS の `@Inject(MurmurRepository)` で注入するために、値空間にも同名の識別子を用意している
 */
export const MurmurRepository = "MurmurRepository" as const;
