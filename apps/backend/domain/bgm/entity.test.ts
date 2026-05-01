import type { BgmCurrent, BgmState, MemberId, TrackId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { set, stop, undo } from "./entity";
import { UndoBySelf, UndoExpired, UndoUnavailable, UnknownTrack } from "./errors";

const alice = "alice" as MemberId;
const bob = "bob" as MemberId;
const blues = "Blues" as TrackId;
const danceNight = "DanceNight" as TrackId;

const empty: BgmState = { current: null, undoable: null };

const currentOf = (trackId: TrackId, setBy: MemberId, setAt: string): BgmCurrent => ({
  trackId,
  setBy,
  setAt,
});

describe("set", () => {
  it("空の state に set すると current が入って undoable 窓が開く", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    const next = set(empty, { trackId: blues, memberId: alice, now });

    expect(next.current).toEqual({
      trackId: blues,
      setBy: alice,
      setAt: "2026-04-22T10:00:00.000Z",
    });
    expect(next.undoable).toEqual({
      until: "2026-04-22T10:00:10.000Z",
      previous: null,
      byMemberId: alice,
    });
  });

  it("既存 current がある state に set すると previous に旧値が残る", () => {
    const previous = currentOf(blues, alice, "2026-04-22T10:00:00.000Z");
    const state: BgmState = { current: previous, undoable: null };
    const now = new Date("2026-04-22T10:05:00.000Z");

    const next = set(state, { trackId: danceNight, memberId: bob, now });

    expect(next.current?.trackId).toBe(danceNight);
    expect(next.current?.setBy).toBe(bob);
    expect(next.undoable?.previous).toEqual(previous);
    expect(next.undoable?.byMemberId).toBe(bob);
  });

  it("未登録 track を指定すると UnknownTrack を投げる", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    expect(() => set(empty, { trackId: "unknown-track" as TrackId, memberId: alice, now })).toThrow(
      UnknownTrack,
    );
  });
});

describe("stop", () => {
  it("鳴っている BGM を stop すると current が null になり previous に旧値が残る", () => {
    const previous = currentOf(blues, alice, "2026-04-22T10:00:00.000Z");
    const state: BgmState = { current: previous, undoable: null };
    const now = new Date("2026-04-22T10:05:00.000Z");

    const next = stop(state, { memberId: bob, now });

    expect(next.current).toBeNull();
    expect(next.undoable?.previous).toEqual(previous);
    expect(next.undoable?.byMemberId).toBe(bob);
  });

  it("既に無音の state を stop すると previous も null の undoable 窓が開く", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    const next = stop(empty, { memberId: alice, now });

    expect(next.current).toBeNull();
    expect(next.undoable?.previous).toBeNull();
    expect(next.undoable?.byMemberId).toBe(alice);
  });
});

describe("undo", () => {
  const until = "2026-04-22T10:00:10.000Z";
  const current = currentOf(danceNight, bob, "2026-04-22T10:00:00.000Z");
  const previous = currentOf(blues, alice, "2026-04-22T09:00:00.000Z");

  it("undo 窓中の変更を他 member が取り消すと current が previous に戻る", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: bob },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    const next = undo(state, { memberId: alice, now });

    expect(next.current).toEqual(previous);
    expect(next.undoable).toBeNull();
  });

  it("previous が null の undoable を undo すると current も null に戻る", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous: null, byMemberId: bob },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    const next = undo(state, { memberId: alice, now });

    expect(next.current).toBeNull();
    expect(next.undoable).toBeNull();
  });

  it("自身の変更を undo しようとすると UndoBySelf を投げる", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: bob },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    expect(() => undo(state, { memberId: bob, now })).toThrow(UndoBySelf);
  });

  it("窓が expire した後の undo は UndoExpired を投げる", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: bob },
    };
    const now = new Date("2026-04-22T10:00:11.000Z");

    expect(() => undo(state, { memberId: alice, now })).toThrow(UndoExpired);
  });

  it("undoable が無い state への undo は UndoUnavailable を投げる", () => {
    const state: BgmState = { current, undoable: null };
    const now = new Date("2026-04-22T10:00:05.000Z");

    expect(() => undo(state, { memberId: alice, now })).toThrow(UndoUnavailable);
  });
});
