import type { InvitationId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HallwayInvitationTimers } from "./invitation-timers";

describe("HallwayInvitationTimers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("登録した遅延時間の経過後に callback が呼ばれる", () => {
    const timers = new HallwayInvitationTimers();
    const callback = vi.fn();

    timers.register("i1" as InvitationId, 1_000, callback);
    vi.advanceTimersByTime(1_000);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("キャンセルすると callback は呼ばれない", () => {
    const timers = new HallwayInvitationTimers();
    const callback = vi.fn();

    timers.register("i1" as InvitationId, 1_000, callback);
    timers.cancel("i1" as InvitationId);
    vi.advanceTimersByTime(5_000);

    expect(callback).not.toHaveBeenCalled();
  });

  it("存在しない id をキャンセルしても無視する", () => {
    const timers = new HallwayInvitationTimers();

    expect(() => timers.cancel("absent" as InvitationId)).not.toThrow();
  });
});
