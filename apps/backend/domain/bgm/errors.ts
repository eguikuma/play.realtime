import type { MemberId } from "@play.realtime/contracts";

export class UnknownTrack extends Error {
  readonly trackId: string;

  constructor(trackId: string) {
    super(`Unknown BGM track ${trackId}`);
    this.name = "UnknownTrack";
    this.trackId = trackId;
  }
}

export class UndoUnavailable extends Error {
  constructor() {
    super("No undoable BGM change is available");
    this.name = "UndoUnavailable";
  }
}

export class UndoExpired extends Error {
  constructor() {
    super("The BGM undo window has expired");
    this.name = "UndoExpired";
  }
}

export class UndoBySelf extends Error {
  readonly memberId: MemberId;

  constructor(memberId: MemberId) {
    super(`Member ${memberId} cannot undo their own BGM change`);
    this.name = "UndoBySelf";
    this.memberId = memberId;
  }
}
