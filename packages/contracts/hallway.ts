import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";
import { ConnectionId } from "./vibe";

/**
 * 招待を一意に識別する ID
 * サーバーが発行し 招待の一生を通じて識別子として使う
 */
export const InvitationId = z.string().min(1).brand<"InvitationId">();
export type InvitationId = z.infer<typeof InvitationId>;

/**
 * 通話を一意に識別する ID
 * 承諾によって招待が通話へ昇格する際にサーバーが発行する
 */
export const CallId = z.string().min(1).brand<"CallId">();
export type CallId = z.infer<typeof CallId>;

/**
 * 未応答の招待を表す
 * 失効時刻を過ぎるとサーバーが自動で失効処理を行い `InvitationEnded` を配信する
 * ルーム ID を保持するのはルーム全員に取り込み中表示を伝える必要があるため
 */
export const Invitation = z.object({
  id: InvitationId,
  roomId: RoomId,
  fromMemberId: MemberId,
  toMemberId: MemberId,
  expiresAt: z.iso.datetime(),
});
export type Invitation = z.infer<typeof Invitation>;

/**
 * 成立した 1 対 1 の通話を表す
 * メンバー ID は 2 要素の組で 招待した側 招待された側の順で固定する
 * ルーム ID を保持するのはルーム全員に取り込み中表示を伝える必要があるため
 */
export const Call = z.object({
  id: CallId,
  roomId: RoomId,
  memberIds: z.tuple([MemberId, MemberId]),
  startedAt: z.iso.datetime(),
});
export type Call = z.infer<typeof Call>;

/**
 * 通話中のメッセージ 1 件を表す
 * 本文は 500 文字以下であり 送信者は通話の 2 参加者のどちらかとなる
 */
export const CallMessage = z.object({
  callId: CallId,
  fromMemberId: MemberId,
  text: z.string().min(1).max(500),
  sentAt: z.iso.datetime(),
});
export type CallMessage = z.infer<typeof CallMessage>;

/**
 * 通話終了の理由を表す列挙
 * 明示終了は離脱ボタンによる操作を表し 切断は WebSocket の切断によるタブ閉じや事故切断を表す
 */
export const CallEndReason = z.enum(["explicit", "disconnect"]);
export type CallEndReason = z.infer<typeof CallEndReason>;

/**
 * WebSocket 接続を開いた直後に該当接続だけへ送る初期化ペイロード
 * クライアントはここで受け取った接続 ID を以降同一 WebSocket 接続の識別子として扱う
 */
export const HallwayWelcome = z.object({
  connectionId: ConnectionId,
});
export type HallwayWelcome = z.infer<typeof HallwayWelcome>;

/**
 * WebSocket 接続の直後にまとめて送る起動ペイロードを持つ
 * 自分が関わる未応答の招待と進行中の通話のみを含む
 */
export const HallwaySnapshot = z.object({
  invitations: z.array(Invitation),
  calls: z.array(Call),
});
export type HallwaySnapshot = z.infer<typeof HallwaySnapshot>;

/**
 * 招待が発行されたとき 招待した側と招待された側の両方へ配信するイベント
 * 受信側はこれをもとに招待表示へ切り替える
 */
export const HallwayInvited = z.object({
  invitation: Invitation,
});
export type HallwayInvited = z.infer<typeof HallwayInvited>;

/**
 * 招待終了の理由を表す列挙
 * `expired` はサーバー側のタイムアウトによる失効を表す
 * `declined` は招待された側の辞退を表す
 * `cancelled` は招待した側の取り消しを表す
 * `accepted` は通話への昇格を表す
 */
export const InvitationEndReason = z.enum(["expired", "declined", "cancelled", "accepted"]);
export type InvitationEndReason = z.infer<typeof InvitationEndReason>;

/**
 * 招待が終了したとき関係者へ配信するイベント
 * 理由で 4 種類の終了原因を区別する
 * 承諾の場合は `CallStarted` イベントも別途流れ クライアントは招待を除去した上で通話を追加する
 */
export const HallwayInvitationEnded = z.object({
  invitationId: InvitationId,
  reason: InvitationEndReason,
});
export type HallwayInvitationEnded = z.infer<typeof HallwayInvitationEnded>;

/**
 * 承諾を受けて通話が開始されたとき 両参加者へ配信するイベント
 */
export const HallwayCallStarted = z.object({
  call: Call,
});
export type HallwayCallStarted = z.infer<typeof HallwayCallStarted>;

/**
 * 通話中のメッセージ 1 件が配信されたときのイベント
 */
export const HallwayMessage = z.object({
  message: CallMessage,
});
export type HallwayMessage = z.infer<typeof HallwayMessage>;

/**
 * 通話が終了したとき両参加者へ配信するイベント
 * 明示終了と切断のどちらの経路でも同じイベントを送る
 */
export const HallwayCallEnded = z.object({
  callId: CallId,
  reason: CallEndReason,
});
export type HallwayCallEnded = z.infer<typeof HallwayCallEnded>;

/**
 * コマンド処理に失敗した理由を表す列挙
 * 廊下トークのドメイン例外 6 種に 1 対 1 で対応する
 */
export const HallwayErrorCode = z.enum([
  "SelfInviteNotAllowed",
  "InviterBusy",
  "InviteeUnavailable",
  "InvitationNotFound",
  "CallNotFound",
  "NotCallParticipant",
]);
export type HallwayErrorCode = z.infer<typeof HallwayErrorCode>;

/**
 * 直前に送ったクライアント命令の名前
 * エラー通知に合わせて送り 受信側が何の操作で失敗したかを識別できるようにする
 */
export const HallwayCommandName = z.enum([
  "Invite",
  "Accept",
  "Decline",
  "Cancel",
  "Send",
  "Leave",
]);
export type HallwayCommandName = z.infer<typeof HallwayCommandName>;

/**
 * 命令が失敗したことを 操作した本人の接続だけに返すイベント
 * コードと元命令名に加え 表示用の短い理由文も同梱する
 */
export const HallwayCommandFailed = z.object({
  code: HallwayErrorCode,
  command: HallwayCommandName,
  message: z.string(),
});
export type HallwayCommandFailed = z.infer<typeof HallwayCommandFailed>;

/**
 * WebSocket でサーバーからクライアントへ送るメッセージ名とペイロードスキーマの対応表
 * `Welcome` と `CommandFailed` は該当接続だけへ直送するため配信経路には乗らない
 */
export const HallwayServerMessages = {
  Welcome: HallwayWelcome,
  Snapshot: HallwaySnapshot,
  Invited: HallwayInvited,
  InvitationEnded: HallwayInvitationEnded,
  CallStarted: HallwayCallStarted,
  Message: HallwayMessage,
  CallEnded: HallwayCallEnded,
  CommandFailed: HallwayCommandFailed,
} as const;

/**
 * 相手に話しかけるリクエスト
 * 対象メンバーが在室中でかつ他の通話に入っていないことをサーバー側で再検証する
 */
export const HallwayInviteRequest = z.object({
  targetMemberId: MemberId,
});
export type HallwayInviteRequest = z.infer<typeof HallwayInviteRequest>;

/**
 * 自分宛の招待を受けるリクエスト
 */
export const HallwayAcceptRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayAcceptRequest = z.infer<typeof HallwayAcceptRequest>;

/**
 * 自分宛の招待を辞退するリクエスト
 */
export const HallwayDeclineRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayDeclineRequest = z.infer<typeof HallwayDeclineRequest>;

/**
 * 自分が出した招待を取り消すリクエスト
 */
export const HallwayCancelRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayCancelRequest = z.infer<typeof HallwayCancelRequest>;

/**
 * 通話中にメッセージを送るリクエスト
 * 通話 ID はクライアントが `CallStarted` で受け取った値をそのまま含める
 */
export const HallwaySendMessageRequest = z.object({
  callId: CallId,
  text: z.string().min(1).max(500),
});
export type HallwaySendMessageRequest = z.infer<typeof HallwaySendMessageRequest>;

/**
 * 通話を明示的に終了するリクエスト
 * 通話 ID はクライアントが `CallStarted` で受け取った値をそのまま含める
 */
export const HallwayLeaveCallRequest = z.object({
  callId: CallId,
});
export type HallwayLeaveCallRequest = z.infer<typeof HallwayLeaveCallRequest>;

/**
 * WebSocket でクライアントからサーバーへ送るメッセージ名とペイロードスキーマの対応表
 */
export const HallwayClientMessages = {
  Invite: HallwayInviteRequest,
  Accept: HallwayAcceptRequest,
  Decline: HallwayDeclineRequest,
  Cancel: HallwayCancelRequest,
  Send: HallwaySendMessageRequest,
  Leave: HallwayLeaveCallRequest,
} as const;

/**
 * WebSocket の通信路で受け渡す包み形式
 * 名前にはサーバー側もしくはクライアント側のメッセージ一覧の鍵文字列が入り 本体には対応するスキーマのペイロードが入る
 */
export const HallwayEnvelope = z.object({
  name: z.string().min(1),
  data: z.unknown(),
});
export type HallwayEnvelope = z.infer<typeof HallwayEnvelope>;
