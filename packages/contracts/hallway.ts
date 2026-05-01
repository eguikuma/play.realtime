import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";
import { ConnectionId } from "./vibe";

/**
 * 廊下トークの招待 1 件を一意に識別するブランド型
 * 招待はマッチングが成立しなかった場合もログとして残るため、通話 `CallId` とは独立に採番する
 */
export const InvitationId = z.string().min(1).brand<"InvitationId">();
export type InvitationId = z.infer<typeof InvitationId>;

/**
 * 廊下トークの通話 1 件を一意に識別するブランド型
 * 招待が `Accept` されて成立した通話だけに付き、招待そのものを指す `InvitationId` とは別の ID 空間を持つ
 */
export const CallId = z.string().min(1).brand<"CallId">();
export type CallId = z.infer<typeof CallId>;

/**
 * 廊下トークの招待 1 件、`Invite` 発行から `Accept` / `Decline` / `Cancel` / 期限切れまでの間だけ存在する
 * サーバ側はこの値を保持して、期限到来時に自動で `expired` として終わらせる
 */
export const Invitation = z.object({
  /** 招待を一意に識別するブランド型 ID */
  id: InvitationId,
  /** 招待が発行されたルームの `RoomId` */
  roomId: RoomId,
  /** 招待したメンバーの `MemberId` */
  fromMemberId: MemberId,
  /** 招待されたメンバーの `MemberId` */
  toMemberId: MemberId,
  /** 招待が自動失効する時刻を ISO 8601 形式で保持する */
  expiresAt: z.iso.datetime(),
});
export type Invitation = z.infer<typeof Invitation>;

/**
 * 廊下トークで成立した 1 対 1 の通話セッション
 * 参加者は常に 2 人で、招待の `Accept` によってのみ生成される
 */
export const Call = z.object({
  /** 通話を一意に識別するブランド型 ID */
  id: CallId,
  /** 通話が行われているルームの `RoomId` */
  roomId: RoomId,
  /** 通話参加者 2 人の `MemberId` を固定長 tuple として保持する */
  memberIds: z.tuple([MemberId, MemberId]),
  /** 通話が成立した時刻を ISO 8601 形式で保持する */
  startedAt: z.iso.datetime(),
});
export type Call = z.infer<typeof Call>;

/**
 * 通話中にやり取りされる 1 通分のメッセージ
 * サーバは受信したテキストに送信者 `MemberId` と受付時刻を付けて通話参加者の両方へ配信する
 */
export const CallMessage = z.object({
  /** このメッセージが属する通話の `CallId` */
  callId: CallId,
  /** 送信者の `MemberId` */
  fromMemberId: MemberId,
  /** メッセージ本文、1 文字以上 500 文字以下 */
  text: z.string().min(1).max(500),
  /** サーバがメッセージを受け付けた時刻を ISO 8601 形式で保持する */
  sentAt: z.iso.datetime(),
});
export type CallMessage = z.infer<typeof CallMessage>;

/**
 * 通話が終わった理由
 * `explicit` は参加者の明示的な `Leave` コマンドによる終了、`disconnect` は WebSocket 切断の検知による終了を表す
 */
export const CallEndReason = z.enum(["explicit", "disconnect"]);
export type CallEndReason = z.infer<typeof CallEndReason>;

/**
 * Hallway WebSocket の接続確立直後に 1 度だけ送る `Welcome` イベント
 * クライアントはこの `connectionId` を自分の接続識別子として保持し、後続のログやデバッグで突き合わせる
 */
export const HallwayWelcome = z.object({
  /** 今回確立された WebSocket 接続の ID */
  connectionId: ConnectionId,
});
export type HallwayWelcome = z.infer<typeof HallwayWelcome>;

/**
 * Hallway WebSocket の購読開始直後に 1 度だけ送る `Snapshot` イベント
 * ルーム内で進行中の招待と通話をまとめて配信し、遅れて参加したクライアントも現状を再構築できる
 */
export const HallwaySnapshot = z.object({
  /** 進行中の全招待 */
  invitations: z.array(Invitation),
  /** 進行中の全通話 */
  calls: z.array(Call),
});
export type HallwaySnapshot = z.infer<typeof HallwaySnapshot>;

/**
 * 誰かから招待が発行されたことをルーム全体に通知する `Invited` イベント
 * 招待された本人の UI には着信、それ以外のメンバーには対象メンバーの取り込み中表示のきっかけとして使う
 */
export const HallwayInvited = z.object({
  /** 新しく発行された招待の詳細 */
  invitation: Invitation,
});
export type HallwayInvited = z.infer<typeof HallwayInvited>;

/**
 * 招待が終了した理由
 * `expired` は期限切れ、`declined` は相手が `Decline`、`cancelled` は自分が `Cancel`、`accepted` は相手が `Accept` して通話が成立したことを指す
 */
export const InvitationEndReason = z.enum(["expired", "declined", "cancelled", "accepted"]);
export type InvitationEndReason = z.infer<typeof InvitationEndReason>;

/**
 * 招待の終了をルーム全体に通知する `InvitationEnded` イベント
 * 発行元と対象メンバー以外にも配信し、取り込み中表示の解除など全員の UI を揃える
 */
export const HallwayInvitationEnded = z.object({
  /** 終了した招待の `InvitationId` */
  invitationId: InvitationId,
  /** 終了に至った理由 */
  reason: InvitationEndReason,
});
export type HallwayInvitationEnded = z.infer<typeof HallwayInvitationEnded>;

/**
 * 通話が成立したことをルーム全体に通知する `CallStarted` イベント
 * 参加者 2 人には通話画面への遷移、それ以外のメンバーには取り込み中表示のきっかけとして使う
 */
export const HallwayCallStarted = z.object({
  /** 成立した通話の詳細 */
  call: Call,
});
export type HallwayCallStarted = z.infer<typeof HallwayCallStarted>;

/**
 * 通話中のメッセージを通話参加者へ配信する `Message` イベント
 * 送信者本人にも同じメッセージを返すことで、複数接続を持つクライアントの表示を一致させる
 */
export const HallwayMessage = z.object({
  /** 受信したメッセージ 1 通分 */
  message: CallMessage,
});
export type HallwayMessage = z.infer<typeof HallwayMessage>;

/**
 * 通話が終了したことをルーム全体に通知する `CallEnded` イベント
 * 参加者には通話画面のクローズ、それ以外のメンバーには取り込み中表示の解除として使う
 */
export const HallwayCallEnded = z.object({
  /** 終了した通話の `CallId` */
  callId: CallId,
  /** 終了に至った理由 */
  reason: CallEndReason,
});
export type HallwayCallEnded = z.infer<typeof HallwayCallEnded>;

/**
 * 自分のコマンドが rejected された理由を表す enum
 * `HallwayCommandFailed.code` として送信元だけに返すため、他メンバーには配信しない
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
 * クライアントから送信可能な全コマンド名の enum
 * `HallwayCommandFailed.command` に詰めて、どのコマンドが rejected されたかを送信元に返すために使う
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
 * 自分が送ったコマンドがサーバで rejected されたときに、送信元の接続だけに届く通知
 * ブロードキャストされないため、他メンバーのクライアントにはこの失敗は見えない
 */
export const HallwayCommandFailed = z.object({
  /** 失敗の種類を表す安定コード、クライアント側のトースト文言出し分けに使う */
  code: HallwayErrorCode,
  /** どのコマンドが失敗したか */
  command: HallwayCommandName,
  /** ログや詳細表示向けの人間可読メッセージ */
  message: z.string(),
});
export type HallwayCommandFailed = z.infer<typeof HallwayCommandFailed>;

/**
 * Hallway WebSocket でサーバからクライアントへ配信する全メッセージ名と schema のマップ
 * サーバ側の配信ディスパッチ、クライアント側の受信パースで共通の参照表として使う
 */
export const HallwayServerMessages = {
  /** 接続確立直後の `connectionId` 採番通知 */
  Welcome: HallwayWelcome,
  /** 購読開始直後の進行中招待 / 通話の一括配信 */
  Snapshot: HallwaySnapshot,
  /** 新しい招待発行のルーム全体通知 */
  Invited: HallwayInvited,
  /** 招待終了のルーム全体通知 */
  InvitationEnded: HallwayInvitationEnded,
  /** 通話成立のルーム全体通知 */
  CallStarted: HallwayCallStarted,
  /** 通話中メッセージの参加者向け配信 */
  Message: HallwayMessage,
  /** 通話終了のルーム全体通知 */
  CallEnded: HallwayCallEnded,
  /** 自分のコマンドが rejected されたときの送信元限定通知 */
  CommandFailed: HallwayCommandFailed,
} as const;

/**
 * `Invite` コマンドのペイロード契約
 * 招待相手の `MemberId` のみを送り、`InvitationId` はサーバ側で採番する
 */
export const HallwayInviteRequest = z.object({
  /** 招待したい相手メンバーの `MemberId` */
  inviteeId: MemberId,
});
export type HallwayInviteRequest = z.infer<typeof HallwayInviteRequest>;

/**
 * `Accept` コマンドのペイロード契約
 * 招待された側が受けた招待 ID を指定して通話を成立させる
 */
export const HallwayAcceptRequest = z.object({
  /** 受諾する招待の `InvitationId` */
  invitationId: InvitationId,
});
export type HallwayAcceptRequest = z.infer<typeof HallwayAcceptRequest>;

/**
 * `Decline` コマンドのペイロード契約
 * 招待された側が受けた招待 ID を指定して招待を拒否する
 */
export const HallwayDeclineRequest = z.object({
  /** 拒否する招待の `InvitationId` */
  invitationId: InvitationId,
});
export type HallwayDeclineRequest = z.infer<typeof HallwayDeclineRequest>;

/**
 * `Cancel` コマンドのペイロード契約
 * 招待した側が自分の発行した招待 ID を指定して取り消す
 */
export const HallwayCancelRequest = z.object({
  /** 取り消す招待の `InvitationId` */
  invitationId: InvitationId,
});
export type HallwayCancelRequest = z.infer<typeof HallwayCancelRequest>;

/**
 * `Send` コマンドのペイロード契約
 * 通話参加者が本文を送ると、サーバ側が `CallMessage` に変換して両参加者へ配信する
 */
export const HallwaySendMessageRequest = z.object({
  /** 発言先の通話 `CallId` */
  callId: CallId,
  /** 送信する本文、1 文字以上 500 文字以下 */
  text: z.string().min(1).max(500),
});
export type HallwaySendMessageRequest = z.infer<typeof HallwaySendMessageRequest>;

/**
 * `Leave` コマンドのペイロード契約
 * 参加者が明示的に通話から退出するときに送る、サーバ側は `CallEnded` の `explicit` として配信する
 */
export const HallwayLeaveCallRequest = z.object({
  /** 退出する通話の `CallId` */
  callId: CallId,
});
export type HallwayLeaveCallRequest = z.infer<typeof HallwayLeaveCallRequest>;

/**
 * Hallway WebSocket でクライアントからサーバへ送る全コマンド名と schema のマップ
 * クライアント側の送信構築、サーバ側の受信パースで共通の参照表として使う
 */
export const HallwayClientMessages = {
  /** 招待発行 */
  Invite: HallwayInviteRequest,
  /** 招待受諾、通話を成立させる */
  Accept: HallwayAcceptRequest,
  /** 招待拒否 */
  Decline: HallwayDeclineRequest,
  /** 招待の取り消し */
  Cancel: HallwayCancelRequest,
  /** 通話中メッセージの送信 */
  Send: HallwaySendMessageRequest,
  /** 通話からの明示的退出 */
  Leave: HallwayLeaveCallRequest,
} as const;

/**
 * Hallway WebSocket で送受信される全メッセージの共通封筒
 * `name` で `HallwayServerMessages` / `HallwayClientMessages` のキーを指定し、`data` 側を対応する schema で個別に検証する 2 段階パースを前提とする
 */
export const HallwayEnvelope = z.object({
  /** メッセージ種別のキー、`HallwayServerMessages` / `HallwayClientMessages` のいずれかに一致する */
  name: z.string().min(1),
  /** 種別に応じた本体ペイロード、まだ schema 検証前なので `unknown` として受ける */
  data: z.unknown(),
});
export type HallwayEnvelope = z.infer<typeof HallwayEnvelope>;
