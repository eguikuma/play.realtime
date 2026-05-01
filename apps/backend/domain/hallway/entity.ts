import type { Call, Invitation, MemberId } from "@play.realtime/contracts";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

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
