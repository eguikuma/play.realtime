import type { MemberId } from "@play.realtime/contracts";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

/**
 * 招待を出せるかをドメイン規則で検証する
 * 自分宛の招待は不可とし 招待する側の取り込み中や 招待される側の不在や取り込み中もここで弾く
 * 呼び出し側は通信層や永続化の状態を読み取ったうえで この関数に渡す
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
