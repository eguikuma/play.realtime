import * as z from "zod";
import { Member, MemberId } from "./member";

/**
 * ルームを一意に識別する ID
 * 推測されにくい文字列とすることで URL 自体がアクセス制限として働く
 */
export const RoomId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{10,}$/)
  .brand<"RoomId">();
export type RoomId = z.infer<typeof RoomId>;

/**
 * ホストが作成した 1 つのルームを表す
 * 参加メンバー一覧はホストを含み 入室した順に並ぶ
 */
export const Room = z.object({
  id: RoomId,
  hostMemberId: MemberId,
  members: z.array(Member),
  createdAt: z.iso.datetime(),
});
export type Room = z.infer<typeof Room>;

/**
 * ホストが最初にルームを発行するときのリクエスト
 * ホスト名はそのままホスト自身の表示名として登録される
 */
export const CreateRoomRequest = z.object({
  hostName: z.string().min(1).max(24),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

/**
 * 既存ルームへ参加するときのリクエスト
 * 名前はそのまま参加メンバーの表示名として登録される
 */
export const JoinRoomRequest = z.object({
  name: z.string().min(1).max(24),
});
export type JoinRoomRequest = z.infer<typeof JoinRoomRequest>;

/**
 * クライアントがルームと自身の紐付きを復元するための組を表す
 */
export const RoomMembership = z.object({
  /** ルーム全体と参加メンバー一覧を持つ */
  room: Room,
  /** cookie セッションから解決した自分自身のメンバー情報を持つ */
  me: Member,
});
export type RoomMembership = z.infer<typeof RoomMembership>;
