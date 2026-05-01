import type { MemberId } from "@play.realtime/contracts";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

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
