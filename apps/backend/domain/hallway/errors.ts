import type { CallId, InvitationId, MemberId } from "@play.realtime/contracts";

export class InvitationNotFound extends Error {
  readonly id: InvitationId;

  constructor(id: InvitationId) {
    super(`Invitation not found ${id}`);
    this.name = "InvitationNotFound";
    this.id = id;
  }
}

export class CallNotFound extends Error {
  readonly id: CallId;

  constructor(id: CallId) {
    super(`Call not found ${id}`);
    this.name = "CallNotFound";
    this.id = id;
  }
}

export class InviteeUnavailable extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Invitee unavailable ${memberId}`);
    this.name = "InviteeUnavailable";
    this.memberId = memberId;
  }
}

export class InviterBusy extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Inviter busy ${memberId}`);
    this.name = "InviterBusy";
    this.memberId = memberId;
  }
}

export class SelfInviteNotAllowed extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Self invite not allowed ${memberId}`);
    this.name = "SelfInviteNotAllowed";
    this.memberId = memberId;
  }
}

export class NotCallParticipant extends Error {
  readonly callId: CallId;

  readonly memberId: MemberId;

  constructor(callId: CallId, memberId: MemberId) {
    super(`Not a call participant ${memberId} in ${callId}`);
    this.name = "NotCallParticipant";
    this.callId = callId;
    this.memberId = memberId;
  }
}
