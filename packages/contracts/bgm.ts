import * as z from "zod";
import { MemberId } from "./member";

export const TrackIds = [
  "Blues",
  "DanceNight",
  "Dramatic",
  "DrumStomp",
  "BassGroove",
  "FunkWalk",
  "ActionRock",
  "PromoRock",
  "Hype",
  "Comedy",
] as const;

export const TrackId = z.enum(TrackIds);
export type TrackId = z.infer<typeof TrackId>;

export const BgmCurrent = z.object({
  trackId: TrackId,
  setBy: MemberId,
  setAt: z.iso.datetime(),
});
export type BgmCurrent = z.infer<typeof BgmCurrent>;

export const BgmUndoable = z.object({
  until: z.iso.datetime(),
  previous: BgmCurrent.nullable(),
  byMemberId: MemberId,
});
export type BgmUndoable = z.infer<typeof BgmUndoable>;

export const BgmState = z.object({
  current: BgmCurrent.nullable(),

  undoable: BgmUndoable.nullable(),
});
export type BgmState = z.infer<typeof BgmState>;

export const BgmSnapshot = z.object({
  state: BgmState,
});
export type BgmSnapshot = z.infer<typeof BgmSnapshot>;

export const BgmChanged = z.object({
  state: BgmState,
});
export type BgmChanged = z.infer<typeof BgmChanged>;

export const BgmEvents = {
  Snapshot: BgmSnapshot,
  Changed: BgmChanged,
} as const;

export const SetBgmRequest = z.object({
  trackId: TrackId,
});
export type SetBgmRequest = z.infer<typeof SetBgmRequest>;
