import type { Call, CallId, Invitation, MemberId } from "@play.realtime/contracts";
import {
  InvitationNotFound,
  InviteeUnavailable,
  InviterBusy,
  SelfInviteNotAllowed,
} from "./errors";

/**
 * 廊下トークの取り込み中判定に使うメンバーの関与状態をまとめた値
 * 発信中の招待、着信中の招待、参加中の通話のいずれかを保持していれば取り込み中とみなす
 */
export type MemberEngagements = {
  outgoing: Invitation | null;
  incoming: Invitation | null;
  call: Call | null;
};

/**
 * 廊下トークの取り込み中判定をひとつに集約する純粋関数
 * 発信中招待、着信中招待、通話のいずれかが立っていれば取り込み中とみなし、招待発行や切断時の整理判定で同じ定義を使い回す
 */
export const isBusy = (engagements: MemberEngagements): boolean =>
  engagements.outgoing !== null || engagements.incoming !== null || engagements.call !== null;

/**
 * 廊下トークの招待発行前にチェックするガード純粋関数
 * 招待発行が許される 3 条件を順に検証し、違反があれば個別の Domain Error を投げる
 * 自分自身への招待は禁止、招待者が既に通話中なら発行できず、被招待者は在室中かつ取り込み中でない必要がある
 */
export const canInvite = ({
  inviter,
  invitee,
}: {
  inviter: { id: MemberId; busy: boolean };
  invitee: { id: MemberId; busy: boolean; present: boolean };
}): void => {
  if (inviter.id === invitee.id) {
    throw new SelfInviteNotAllowed(inviter.id);
  }
  if (inviter.busy) {
    throw new InviterBusy(inviter.id);
  }
  if (!invitee.present || invitee.busy) {
    throw new InviteeUnavailable(invitee.id);
  }
};

/**
 * 招待を受諾しようとしているメンバーが本人かどうかを検証するガード純粋関数
 * 招待の受信者でないメンバーが受諾を試みたときは、招待そのものの存在も明かさず `InvitationNotFound` を投げる
 */
export const canAccept = (invitation: Invitation, callerId: MemberId): void => {
  if (invitation.toMemberId !== callerId) {
    throw new InvitationNotFound(invitation.id);
  }
};

/**
 * 招待を辞退しようとしているメンバーが本人かどうかを検証するガード純粋関数
 * 他人の招待に Decline を投げつける経路を塞ぎ、受信者でない場合は `InvitationNotFound` を投げる
 */
export const canDecline = (invitation: Invitation, callerId: MemberId): void => {
  if (invitation.toMemberId !== callerId) {
    throw new InvitationNotFound(invitation.id);
  }
};

/**
 * 招待の受諾という状態遷移を表現する純粋関数
 * 受信者本人ガードを通したうえで、招待の発信者と受信者を 2 人参加メンバーに据えた `Call` を組み立てて返す
 * 招待の削除タイマー停止、`Call` の保存、UI 切替を伴う配信順序の制御は呼び出し元 usecase の責務として残す
 */
export const acceptInvitation = (parameters: {
  invitation: Invitation;
  callerId: MemberId;
  callId: CallId;
  now: Date;
}): { call: Call } => {
  canAccept(parameters.invitation, parameters.callerId);
  const call: Call = {
    id: parameters.callId,
    roomId: parameters.invitation.roomId,
    memberIds: [parameters.invitation.fromMemberId, parameters.invitation.toMemberId],
    startedAt: parameters.now.toISOString(),
  };
  return { call };
};
