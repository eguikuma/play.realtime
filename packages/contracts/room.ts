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

/**
 * `POST /rooms/{roomId}/leave` の PubSub 配信ペイロード契約
 * モバイルタブ消去時の `pagehide` で sendBeacon された退出シグナルを、SSE と WebSocket の両 Hub に対して横断 fanout するときに使う
 */
export const MemberLeftPayload = z.object({
  /** 退出対象のルーム ID */
  roomId: RoomId,
  /** 退出対象のメンバー ID、当該ルーム内の自分のすべての接続が強制クローズされる */
  memberId: MemberId,
});
export type MemberLeftPayload = z.infer<typeof MemberLeftPayload>;

/**
 * ルーム関連 HTTP エンドポイントの URL を組み立てる定数
 * フロントエンドの呼び出し側とバックエンドの Controller 側で URL の食い違いを起こさないよう、両者がこの定数を経由する前提で配置する
 */
export const RoomEndpoint = {
  /** `POST /rooms` ルーム新規作成 */
  create: () => "/rooms" as const,
  /** `POST /rooms/{roomId}/members` 既存ルームへの入室 */
  join: (roomId: RoomId) => `/rooms/${roomId}/members`,
  /** `GET /rooms/{roomId}/me` 入室済みセッションの自分情報取得 */
  me: (roomId: RoomId) => `/rooms/${roomId}/me`,
  /** `GET /rooms/{roomId}` ルーム集約の取得 */
  get: (roomId: RoomId) => `/rooms/${roomId}`,
  /**
   * `POST /rooms/{roomId}/leave` 明示退出シグナルの送信先
   * ブラウザの `pagehide` から `navigator.sendBeacon` で叩かれ、サーバ側で当該メンバーの全接続を強制クローズする
   */
  leave: (roomId: RoomId) => `/rooms/${roomId}/leave`,
} as const;
