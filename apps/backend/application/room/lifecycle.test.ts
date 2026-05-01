import type { RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryRoomPresence } from "../../infrastructure/presence/in-memory";
import { InMemoryRoomLifecycleGrace } from "../../infrastructure/timer/in-memory/room-lifecycle-grace";
import type { PubSub } from "../shared/ports/pubsub";
import { RoomLifecycle } from "./lifecycle";

const room = "room-abc-1234" as RoomId;

const createPubSubStub = () => {
  const closeByPrefix = vi.fn<(prefix: string) => void>();
  const pubsub: PubSub = {
    publish: vi.fn(async () => undefined),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    closeByPrefix,
  };
  return Object.assign(pubsub, { closeByPrefix });
};

describe("RoomLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ある後片付けが例外を投げても残りの後片付けは呼ばれる", async () => {
    const presence = new InMemoryRoomPresence();
    const grace = new InMemoryRoomLifecycleGrace();
    const lifecycle = new RoomLifecycle(presence, createPubSubStub(), grace);
    lifecycle.overrideGracePeriod(1_000);
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    const healthy = vi.fn(async () => undefined);
    lifecycle.registerCleanup(failing);
    lifecycle.registerCleanup(healthy);

    presence.register(room);
    presence.deregister(room);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledWith(room);
  });

  it("破棄処理を直接呼べば即時に後片付けが走りタイマーも打ち切られる", async () => {
    const presence = new InMemoryRoomPresence();
    const pubsub = createPubSubStub();
    const grace = new InMemoryRoomLifecycleGrace();
    const lifecycle = new RoomLifecycle(presence, pubsub, grace);
    lifecycle.overrideGracePeriod(10_000);
    const cleanup = vi.fn(async () => undefined);
    lifecycle.registerCleanup(cleanup);

    presence.register(room);
    presence.deregister(room);
    await lifecycle.destroy(room);

    expect(cleanup).toHaveBeenCalledWith(room);
    expect(pubsub.closeByPrefix).toHaveBeenCalledWith(`room:${room}:`);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
