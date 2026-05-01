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

  it("登録した遅延時間の経過後にコールバックが呼ばれる", () => {
    const timers = new HallwayInvitationTimers();
    const callback = vi.fn();

    timers.register("i1" as InvitationId, 1_000, callback);
    vi.advanceTimersByTime(1_000);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("取り消すとコールバックは呼ばれない", () => {
    const timers = new HallwayInvitationTimers();
    const callback = vi.fn();

    timers.register("i1" as InvitationId, 1_000, callback);
    timers.cancel("i1" as InvitationId);
    vi.advanceTimersByTime(5_000);

    expect(callback).not.toHaveBeenCalled();
  });

  it("存在しない ID を取り消しても無視する", () => {
    const timers = new HallwayInvitationTimers();

    expect(() => timers.cancel("absent" as InvitationId)).not.toThrow();
  });
});
