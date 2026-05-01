import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";

/**
 * ひとこと投稿を一意に識別する ID
 * サーバー側で生成しクライアントはスナップショットや `Posted` イベントを通じてのみ受け取る
 */
export const MurmurId = z.string().min(1).brand<"MurmurId">();
export type MurmurId = z.infer<typeof MurmurId>;

/**
 * 投稿された 1 件のひとことを表す
 * 本文は 140 文字以下であり 投稿時刻で並び順を解決する
 */
export const Murmur = z.object({
  id: MurmurId,
  roomId: RoomId,
  memberId: MemberId,
  text: z.string().min(1).max(140),
  postedAt: z.iso.datetime(),
});
export type Murmur = z.infer<typeof Murmur>;

/**
 * ひとこと投稿のリクエスト
 * 投稿者の識別と所属ルームは cookie セッションと URL からサーバー側で補完する
 */
export const PostMurmurRequest = z.object({
  text: z.string().min(1).max(140),
});
export type PostMurmurRequest = z.infer<typeof PostMurmurRequest>;

/**
 * SSE の購読開始時に該当クライアントへ直送する起動ペイロード
 * 送信時点でルームが保持している全ひとこと投稿を含む
 */
export const MurmurSnapshot = z.object({
  items: z.array(Murmur),
});
export type MurmurSnapshot = z.infer<typeof MurmurSnapshot>;

/**
 * SSE でサーバーからクライアントへ送るイベント名とペイロードスキーマの対応表
 * `Snapshot` は接続直後に該当クライアントだけへ直送する
 * `Posted` は新規投稿をルーム全員へ配信する
 */
export const MurmurEvents = {
  Snapshot: MurmurSnapshot,
  Posted: Murmur,
} as const;
