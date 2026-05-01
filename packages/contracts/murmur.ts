import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";

/**
 * ひとこと 1 件を一意に識別するブランド型
 * 同一ルーム内で投稿順序を壊さない採番を前提とする
 */
export const MurmurId = z.string().min(1).brand<"MurmurId">();
export type MurmurId = z.infer<typeof MurmurId>;

/**
 * ひとこと投稿 1 件の永続形
 * 投稿者の `MemberId` と本文、サーバが受け付けた時刻を束ねた Murmur 機能の中核エンティティ
 */
export const Murmur = z.object({
  /** 投稿を一意に識別するブランド型 ID */
  id: MurmurId,
  /** この投稿が属するルームの `RoomId` */
  roomId: RoomId,
  /** 投稿者の `MemberId` */
  memberId: MemberId,
  /** 投稿本文、1 文字以上 140 文字以下 */
  text: z.string().min(1).max(140),
  /** サーバが投稿を受け付けた時刻を ISO 8601 形式で保持する */
  postedAt: z.iso.datetime(),
});
export type Murmur = z.infer<typeof Murmur>;

/**
 * `POST /rooms/{roomId}/murmurs` のリクエストボディ契約
 * クライアントは本文のみを渡し、`id` / `memberId` / `postedAt` はサーバ側で採番・付与する
 */
export const PostMurmurRequest = z.object({
  /** 投稿本文、1 文字以上 140 文字以下 */
  text: z.string().min(1).max(140),
});
export type PostMurmurRequest = z.infer<typeof PostMurmurRequest>;

/**
 * Murmur SSE の購読開始直後に 1 度だけ送る `Snapshot` イベント
 * 現時点の全投稿履歴を一括で配信して、遅れて参加したクライアントも過去の流れを再構築できるようにする
 */
export const MurmurSnapshot = z.object({
  /** 現時点の全投稿、古い順に並んだ配列 */
  items: z.array(Murmur),
});
export type MurmurSnapshot = z.infer<typeof MurmurSnapshot>;

/**
 * Murmur SSE でサーバからクライアントへ配信する全イベント名と対応する schema のマップ
 * サーバ側の配信ディスパッチ、クライアント側の受信パースで共通の参照表として使う
 */
export const MurmurEvents = {
  /** 購読開始直後に 1 度だけ届く、全投稿履歴の一括配信 */
  Snapshot: MurmurSnapshot,
  /** 新しい投稿が受け付けられたときに逐次届く、投稿 1 件の配信 */
  Posted: Murmur,
} as const;

/**
 * ひとこと関連 HTTP エンドポイントの URL を組み立てる定数
 * フロントエンドの呼び出し側とバックエンドの Controller 側で URL の食い違いを起こさないよう、両者がこの定数を経由する前提で配置する
 */
export const MurmurEndpoint = {
  /** `POST /rooms/{roomId}/murmurs` 新規投稿 */
  post: (roomId: RoomId) => `/rooms/${roomId}/murmurs`,
  /** `GET /rooms/{roomId}/murmurs/stream` SSE 購読経路 */
  stream: (roomId: RoomId) => `/rooms/${roomId}/murmurs/stream`,
} as const;
