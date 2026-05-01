import * as z from "zod";
import { Member, MemberId } from "./member";
import type { RoomId } from "./room";

/**
 * Vibe 機能におけるメンバーの在室状態
 * `present` はブラウザタブを開いているだけの在室中、`focused` は入力操作でアクティブと判定された集中状態を表す
 */
export const VibeStatus = z.enum(["present", "focused"]);
export type VibeStatus = z.infer<typeof VibeStatus>;

/**
 * SSE 接続 1 本ごとに発行されるブランド型 ID
 * 同じメンバーが複数タブで接続した場合にもタブ単位で状態を区別できるよう接続粒度で採番する
 */
export const ConnectionId = z.string().min(1).brand<"ConnectionId">();
export type ConnectionId = z.infer<typeof ConnectionId>;

/**
 * あるメンバーに対して集約された現在の在室状態
 * 同一メンバーが複数接続を持つ場合はサーバ側で最も active な接続の値にまとめた後の結果
 */
export const Vibe = z.object({
  /** 対象メンバーの `MemberId` */
  memberId: MemberId,
  /** 集約後の在室状態 */
  status: VibeStatus,
});
export type Vibe = z.infer<typeof Vibe>;

/**
 * Vibe SSE の接続確立直後に 1 度だけ送る `Welcome` イベント
 * クライアントはこの `connectionId` を保持して、以降の状態変更 API 呼び出しで自分の接続を特定する
 */
export const VibeWelcome = z.object({
  /** 今回確立された SSE 接続の ID、クライアントが状態変更リクエストに添付する */
  connectionId: ConnectionId,
});
export type VibeWelcome = z.infer<typeof VibeWelcome>;

/**
 * Vibe SSE の購読開始直後に 1 度だけ送る `Snapshot` イベント
 * 現時点のルーム在室メンバーと各自の集約済みステータスをまとめて初期表示できるように配信する
 */
export const VibeSnapshot = z.object({
  /** 現在ルームに在室している全メンバーの公開プロフィール */
  members: z.array(Member),
  /** 各メンバーの集約済み在室状態、`members` の長さと対応する */
  statuses: z.array(Vibe),
});
export type VibeSnapshot = z.infer<typeof VibeSnapshot>;

/**
 * 新しいメンバーがルームに入室したことを通知する `Joined` イベント
 * 新規メンバーの公開プロフィールと、初期在室状態を同時に届けて既存メンバーの画面へ追加する
 */
export const VibeJoined = z.object({
  /** 入室してきたメンバーの公開プロフィール */
  member: Member,
  /** 入室時点の初期在室状態、既定は `present` */
  status: VibeStatus,
});
export type VibeJoined = z.infer<typeof VibeJoined>;

/**
 * メンバーがルームから退室したことを通知する `Left` イベント
 * 退室検知後に猶予期間を経て確定した結果だけを配信する
 */
export const VibeLeft = z.object({
  /** 退室したメンバーの `MemberId` */
  memberId: MemberId,
});
export type VibeLeft = z.infer<typeof VibeLeft>;

/**
 * 既存メンバーの在室状態が変化したことを通知する `Updated` イベント
 * タブの可視状態変化や明示的な状態切替のたびに、集約後の値で 1 回だけ配信する
 */
export const VibeUpdated = z.object({
  /** 状態が変化したメンバーの `MemberId` */
  memberId: MemberId,
  /** 集約後の新しい在室状態 */
  status: VibeStatus,
});
export type VibeUpdated = z.infer<typeof VibeUpdated>;

/**
 * Vibe SSE でサーバからクライアントへ配信する全イベント名と対応する schema のマップ
 * サーバ側でイベント配信時、クライアント側で受信パース時に共通のディスパッチ表として参照する
 */
export const VibeEvents = {
  /** 接続確立直後に 1 度だけ届く、`connectionId` の採番通知 */
  Welcome: VibeWelcome,
  /** 購読開始直後に 1 度だけ届く、既存メンバーと状態の一括配信 */
  Snapshot: VibeSnapshot,
  /** 新規メンバー入室の逐次通知 */
  Joined: VibeJoined,
  /** メンバー退室の逐次通知 */
  Left: VibeLeft,
  /** 既存メンバーの状態変化の逐次通知 */
  Updated: VibeUpdated,
} as const;

/**
 * `POST /rooms/{roomId}/vibe/status` のリクエストボディ契約
 * クライアントが自分の接続 ID と新しい状態を送って在室状態を明示的に切り替える
 */
export const ChangeVibeStatusRequest = z.object({
  /** 状態変更の主体となる自接続の ID、`VibeWelcome` で受け取った値を使う */
  connectionId: ConnectionId,
  /** 接続に適用したい新しい在室状態 */
  status: VibeStatus,
});
export type ChangeVibeStatusRequest = z.infer<typeof ChangeVibeStatusRequest>;

/**
 * Vibe 関連 HTTP エンドポイントの URL を組み立てる定数
 * フロントエンドの呼び出し側とバックエンドの Controller 側で URL の食い違いを起こさないよう、両者がこの定数を経由する前提で配置する
 */
export const VibeEndpoint = {
  /** `GET /rooms/{roomId}/vibe/stream` SSE 購読経路 */
  stream: (roomId: RoomId) => `/rooms/${roomId}/vibe/stream`,
  /** `POST /rooms/{roomId}/vibe` 在室状態の変更通知 */
  change: (roomId: RoomId) => `/rooms/${roomId}/vibe`,
} as const;
