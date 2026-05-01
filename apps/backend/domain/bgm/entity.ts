import type { BgmState, MemberId, TrackId } from "@play.realtime/contracts";
import { TrackIds } from "@play.realtime/contracts";
import { UndoBySelf, UndoExpired, UndoUnavailable, UnknownTrack } from "./errors";

const UNDO_WINDOW_MS = 10_000;

const ValidTrackIds = new Set<string>(TrackIds);

export const empty = (): BgmState => ({ current: null, undoable: null });

export const set = (
  state: BgmState,
  input: { trackId: TrackId; memberId: MemberId; now: Date },
): BgmState => {
  if (!ValidTrackIds.has(input.trackId)) {
    throw new UnknownTrack(input.trackId);
  }
  return {
    current: {
      trackId: input.trackId,
      setBy: input.memberId,
      setAt: input.now.toISOString(),
    },
    undoable: openWindow(state, input.memberId, input.now),
  };
};

export const stop = (state: BgmState, input: { memberId: MemberId; now: Date }): BgmState => {
  return {
    current: null,
    undoable: openWindow(state, input.memberId, input.now),
  };
};

export const undo = (state: BgmState, input: { memberId: MemberId; now: Date }): BgmState => {
  const { undoable } = state;
  if (!undoable) {
    throw new UndoUnavailable();
  }
  if (undoable.byMemberId === input.memberId) {
    throw new UndoBySelf(input.memberId);
  }
  if (input.now.getTime() > new Date(undoable.until).getTime()) {
    throw new UndoExpired();
  }
  return {
    current: undoable.previous,
    undoable: null,
  };
};

const openWindow = (state: BgmState, memberId: MemberId, now: Date) => ({
  until: new Date(now.getTime() + UNDO_WINDOW_MS).toISOString(),
  previous: state.current,
  byMemberId: memberId,
});
