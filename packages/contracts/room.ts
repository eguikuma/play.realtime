import * as z from "zod";
import { Member, MemberId } from "./member";

/**
 * ルームを一意に識別するブランド型
 * URL に埋めてホストが共有する入室パスとして機能するため、推測されにくい 10 文字以上のランダム文字列を要求する
 */
export const RoomId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{10,}$/)
  .brand<"RoomId">();
export type RoomId = z.infer<typeof RoomId>;

/**
 * ルーム全体を表す集約
 * ホスト 1 人と参加メンバーの配列、生成時刻をまとめて保持する
 */
export const Room = z.object({
  /** ルームを一意に識別するブランド型 ID */
  id: RoomId,
  /** ルームを作成したホストの `MemberId`、members 配列のうちどれが創設者かを示す */
  hostMemberId: MemberId,
  /** ルームに在室しているメンバー一覧、ホスト自身も含む */
  members: z.array(Member),
  /** ルームを作成した時刻を ISO 8601 形式で保持する */
  createdAt: z.iso.datetime(),
});
export type Room = z.infer<typeof Room>;

/**
 * `POST /rooms` のリクエストボディ契約
 * ホストが最初のメンバーとして自身の表示名のみを渡してルームを新規作成する
 */
export const CreateRoomRequest = z.object({
  /** ホストがルーム内で名乗る表示名、1 文字以上 24 文字以下 */
  hostName: z.string().min(1).max(24),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

/**
 * `POST /rooms/{roomId}/members` のリクエストボディ契約
 * 既存ルームに後から参加するメンバーが自身の表示名のみを渡して入室する
 */
export const JoinRoomRequest = z.object({
  /** 参加メンバーがルーム内で名乗る表示名、1 文字以上 24 文字以下 */
  name: z.string().min(1).max(24),
});
export type JoinRoomRequest = z.infer<typeof JoinRoomRequest>;

/**
 * `GET /rooms/{roomId}/me` のレスポンス契約
 * ルームの全景と、呼び出し元セッションから見た自分自身のメンバー情報をまとめて返す
 * クライアントはこれ 1 本でルーム画面の描画と「自分」の識別を両立できる
 */
export const RoomMembership = z.object({
  /** 参加しているルーム全体の集約 */
  room: Room,
  /** 呼び出し元セッションに紐づくメンバー本人、`room.members` のうち 1 件と同値 */
  me: Member,
});
export type RoomMembership = z.infer<typeof RoomMembership>;
