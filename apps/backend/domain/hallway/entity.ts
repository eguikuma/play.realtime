import type { MemberId } from "@play.realtime/contracts";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

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
