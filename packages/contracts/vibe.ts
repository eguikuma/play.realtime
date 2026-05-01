import * as z from "zod";
import { Member, MemberId } from "./member";

/**
 * 空気を表す 2 種類の状態
 * 在室中は単に接続しているだけの状態であり 作業中は実際に手を動かしている状態を示す
 */
export const VibeStatus = z.enum(["present", "focused"]);
export type VibeStatus = z.infer<typeof VibeStatus>;

/**
 * SSE 接続 1 本を一意に識別する ID
 * 同じメンバーが複数タブを開いた場合もタブごとに別の値が割り当てられる
 */
export const ConnectionId = z.string().min(1).brand<"ConnectionId">();
export type ConnectionId = z.infer<typeof ConnectionId>;

/**
 * 1 名のメンバーの現在の空気を表す
 * メンバー単位で集約したあとの結果となる
 */
export const Vibe = z.object({
  memberId: MemberId,
  status: VibeStatus,
});
export type Vibe = z.infer<typeof Vibe>;

/**
 * SSE 接続を開いた直後に該当クライアントだけへ送る初期化ペイロード
 * クライアントはここで受け取った接続 ID を以降の SSE 識別子として使う
 */
export const VibeWelcome = z.object({
  connectionId: ConnectionId,
});
export type VibeWelcome = z.infer<typeof VibeWelcome>;

/**
 * 接続直後にまとめて送る起動ペイロードを持つ
 */
export const VibeSnapshot = z.object({
  /** ルームの全参加メンバー一覧を含む */
  members: z.array(Member),
  /** 各メンバーの現在の空気一覧を含む */
  statuses: z.array(Vibe),
});
export type VibeSnapshot = z.infer<typeof VibeSnapshot>;

/**
 * 新規メンバーがルームに加わったときルーム全員へ配信するイベントを持つ
 */
export const VibeJoined = z.object({
  /** 加わったメンバーの基本情報を含む */
  member: Member,
  /** そのメンバーの初期の空気を含む */
  status: VibeStatus,
});
export type VibeJoined = z.infer<typeof VibeJoined>;

/**
 * あるメンバーの全接続が切れたときルーム全員へ配信するイベント
 * クライアントは該当メンバーをスナップショットから除去する
 */
export const VibeLeft = z.object({
  memberId: MemberId,
});
export type VibeLeft = z.infer<typeof VibeLeft>;

/**
 * あるメンバーの空気が変化したときルーム全員へ配信するイベント
 * 集約後の空気のみを送り 接続単位の詳細は配信しない
 */
export const VibeUpdate = z.object({
  memberId: MemberId,
  status: VibeStatus,
});
export type VibeUpdate = z.infer<typeof VibeUpdate>;

/**
 * SSE でサーバーからクライアントへ送るイベント名とペイロードスキーマの対応表
 * `Welcome` は該当クライアントだけに直送する
 * それ以外のイベントはルーム全員へ配信する
 */
export const VibeEvents = {
  Welcome: VibeWelcome,
  Snapshot: VibeSnapshot,
  Joined: VibeJoined,
  Left: VibeLeft,
  Update: VibeUpdate,
} as const;

/**
 * 空気を変更するリクエスト
 * 接続 ID は送信元のタブを示しサーバー側で集約の入力として使う
 */
export const ChangeVibeStatusRequest = z.object({
  connectionId: ConnectionId,
  status: VibeStatus,
});
export type ChangeVibeStatusRequest = z.infer<typeof ChangeVibeStatusRequest>;
