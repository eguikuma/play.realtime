import type { MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VibePresenceGrace } from "./presence-grace";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;

describe("VibePresenceGrace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedule は 1500ms 後に fire を実行する", async () => {
    const grace = new VibePresenceGrace();
    const fire = vi.fn();

    grace.schedule(roomId, memberId, fire);
    await vi.advanceTimersByTimeAsync(1499);
    expect(fire).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("cancel は pending な予約を取り消し true を返し fire されない", async () => {
    const grace = new VibePresenceGrace();
    const fire = vi.fn();

    grace.schedule(roomId, memberId, fire);
    const cancelled = grace.cancel(roomId, memberId);
    await vi.advanceTimersByTimeAsync(2000);

    expect(cancelled).toBe(true);
    expect(fire).not.toHaveBeenCalled();
  });

  it("予約が無ければ cancel は false を返す", () => {
    const grace = new VibePresenceGrace();
    expect(grace.cancel(roomId, memberId)).toBe(false);
  });

  it("別の room または member では干渉しない", async () => {
    const grace = new VibePresenceGrace();
    const fireA = vi.fn();
    const fireB = vi.fn();
    const otherMemberId = "member-bob" as MemberId;

    grace.schedule(roomId, memberId, fireA);
    grace.schedule(roomId, otherMemberId, fireB);

    grace.cancel(roomId, memberId);
    await vi.advanceTimersByTimeAsync(2000);

    expect(fireA).not.toHaveBeenCalled();
    expect(fireB).toHaveBeenCalledTimes(1);
  });

  it("同キーで再 schedule すると前のタイマーは上書きされる", async () => {
    const grace = new VibePresenceGrace();
    const first = vi.fn();
    const second = vi.fn();

    grace.schedule(roomId, memberId, first);
    grace.schedule(roomId, memberId, second);
    await vi.advanceTimersByTimeAsync(2000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
