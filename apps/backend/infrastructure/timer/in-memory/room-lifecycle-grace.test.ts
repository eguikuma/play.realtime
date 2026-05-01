import type { RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryRoomLifecycleGrace } from "./room-lifecycle-grace";

const room = "room-abc-1234" as RoomId;

describe("InMemoryRoomLifecycleGrace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("予約は猶予経過後に発火を実行する", async () => {
    const grace = new InMemoryRoomLifecycleGrace();
    grace.override(1_000);
    const fire = vi.fn(async () => undefined);

    grace.schedule(room, fire);
    await vi.advanceTimersByTimeAsync(999);
    expect(fire).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("猶予中に取り消すと発火しない", async () => {
    const grace = new InMemoryRoomLifecycleGrace();
    grace.override(1_000);
    const fire = vi.fn(async () => undefined);

    grace.schedule(room, fire);
    await vi.advanceTimersByTimeAsync(500);
    grace.cancel(room);
    await vi.advanceTimersByTimeAsync(2_000);

    expect(fire).not.toHaveBeenCalled();
  });

  it("取り消しの後に再予約すると猶予は再起動する", async () => {
    const grace = new InMemoryRoomLifecycleGrace();
    grace.override(1_000);
    const fire = vi.fn(async () => undefined);

    grace.schedule(room, fire);
    await vi.advanceTimersByTimeAsync(500);
    grace.cancel(room);
    grace.schedule(room, fire);
    await vi.advanceTimersByTimeAsync(999);
    expect(fire).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("同ルームで再予約すると前のタイマーは上書きされる", async () => {
    const grace = new InMemoryRoomLifecycleGrace();
    grace.override(1_000);
    const first = vi.fn(async () => undefined);
    const second = vi.fn(async () => undefined);

    grace.schedule(room, first);
    grace.schedule(room, second);
    await vi.advanceTimersByTimeAsync(2_000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("予約していないルームの取り消しは無視される", () => {
    const grace = new InMemoryRoomLifecycleGrace();

    expect(() => grace.cancel(room)).not.toThrow();
  });
});
