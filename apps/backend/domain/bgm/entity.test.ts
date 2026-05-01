import type { BgmCurrent, BgmState, MemberId, TrackId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { set, stop, undo } from "./entity";
import { UndoBySelf, UndoExpired, UndoUnavailable, UnknownTrack } from "./errors";

const setBy = "setBy" as MemberId;
const changedBy = "changedBy" as MemberId;
const blues = "Blues" as TrackId;
const danceNight = "DanceNight" as TrackId;

const empty: BgmState = { current: null, undoable: null };

const currentOf = (trackId: TrackId, setBy: MemberId, setAt: string): BgmCurrent => ({
  trackId,
  setBy,
  setAt,
});

describe("set", () => {
  it("空の状態で曲を選ぶと現在の曲が入って undo 窓が開く", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    const next = set(empty, { trackId: blues, memberId: setBy, now });

    expect(next.current).toEqual({
      trackId: blues,
      setBy,
      setAt: "2026-04-22T10:00:00.000Z",
    });
    expect(next.undoable).toEqual({
      until: "2026-04-22T10:00:10.000Z",
      previous: null,
      byMemberId: setBy,
    });
  });

  it("現在の曲がある状態で別の曲を選ぶと旧曲が直前の曲として残る", () => {
    const previous = currentOf(blues, setBy, "2026-04-22T10:00:00.000Z");
    const state: BgmState = { current: previous, undoable: null };
    const now = new Date("2026-04-22T10:05:00.000Z");

    const next = set(state, { trackId: danceNight, memberId: changedBy, now });

    expect(next.current?.trackId).toBe(danceNight);
    expect(next.current?.setBy).toBe(changedBy);
    expect(next.undoable?.previous).toEqual(previous);
    expect(next.undoable?.byMemberId).toBe(changedBy);
  });

  it("未登録の曲を指定すると UnknownTrack を投げる", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    expect(() => set(empty, { trackId: "unknown-track" as TrackId, memberId: setBy, now })).toThrow(
      UnknownTrack,
    );
  });
});

describe("stop", () => {
  it("鳴っている BGM を停止すると現在の曲が無音になり旧曲が直前の曲として残る", () => {
    const previous = currentOf(blues, setBy, "2026-04-22T10:00:00.000Z");
    const state: BgmState = { current: previous, undoable: null };
    const now = new Date("2026-04-22T10:05:00.000Z");

    const next = stop(state, { memberId: changedBy, now });

    expect(next.current).toBeNull();
    expect(next.undoable?.previous).toEqual(previous);
    expect(next.undoable?.byMemberId).toBe(changedBy);
  });

  it("既に無音の状態を停止すると直前の曲も無いままの undo 窓が開く", () => {
    const now = new Date("2026-04-22T10:00:00.000Z");

    const next = stop(empty, { memberId: setBy, now });

    expect(next.current).toBeNull();
    expect(next.undoable?.previous).toBeNull();
    expect(next.undoable?.byMemberId).toBe(setBy);
  });
});

describe("undo", () => {
  const until = "2026-04-22T10:00:10.000Z";
  const current = currentOf(danceNight, changedBy, "2026-04-22T10:00:00.000Z");
  const previous = currentOf(blues, setBy, "2026-04-22T09:00:00.000Z");

  it("undo 窓内の変更を他のメンバーが取り消すと現在の曲が直前の曲に戻る", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: changedBy },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    const next = undo(state, { memberId: setBy, now });

    expect(next.current).toEqual(previous);
    expect(next.undoable).toBeNull();
  });

  it("直前の曲が無い undo を実行すると現在の曲も無音に戻る", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous: null, byMemberId: changedBy },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    const next = undo(state, { memberId: setBy, now });

    expect(next.current).toBeNull();
    expect(next.undoable).toBeNull();
  });

  it("自身の変更を undo しようとすると UndoBySelf を投げる", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: changedBy },
    };
    const now = new Date("2026-04-22T10:00:05.000Z");

    expect(() => undo(state, { memberId: changedBy, now })).toThrow(UndoBySelf);
  });

  it("undo 窓が失効した後の undo は UndoExpired を投げる", () => {
    const state: BgmState = {
      current,
      undoable: { until, previous, byMemberId: changedBy },
    };
    const now = new Date("2026-04-22T10:00:11.000Z");

    expect(() => undo(state, { memberId: setBy, now })).toThrow(UndoExpired);
  });

  it("undo 窓が無い状態への undo は UndoUnavailable を投げる", () => {
    const state: BgmState = { current, undoable: null };
    const now = new Date("2026-04-22T10:00:05.000Z");

    expect(() => undo(state, { memberId: setBy, now })).toThrow(UndoUnavailable);
  });
});
