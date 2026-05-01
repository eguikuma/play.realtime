import type { ConnectionId, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { VibeRepository } from "../../domain/vibe";
import type { SseHub } from "../../infrastructure/transport/sse";
import { NotifyVibeLeft } from "./notify-left.usecase";
import { VibePresenceGrace } from "./presence-grace";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const connectionId = "conn-1" as ConnectionId;

const buildVibes = (overrides: Partial<VibeRepository> = {}): VibeRepository => ({
  save: vi.fn(),
  delete: vi.fn(async () => ({ isLast: true, aggregated: null })),
  snapshot: vi.fn(),
  get: vi.fn(),
  ...overrides,
});

const buildHub = (broadcast = vi.fn()): SseHub =>
  ({ broadcast, attach: vi.fn() }) as unknown as SseHub;

const buildGrace = (): VibePresenceGrace =>
  ({ cancel: vi.fn(), schedule: vi.fn() }) as unknown as VibePresenceGrace;

describe("NotifyVibeLeft", () => {
  it("最後の接続が消えると grace 経由で Left を購読者全員に配信する", async () => {
    const vibes = buildVibes();
    const broadcast = vi.fn();
    const grace = buildGrace();
    const usecase = new NotifyVibeLeft(vibes, buildHub(broadcast), grace);

    await usecase.execute({ roomId, memberId, connectionId });

    expect(vibes.delete).toHaveBeenCalledWith(roomId, memberId, connectionId);
    expect(grace.schedule).toHaveBeenCalledWith(roomId, memberId, expect.any(Function));
    expect(broadcast).not.toHaveBeenCalled();

    const call = (grace.schedule as ReturnType<typeof vi.fn>).mock.calls[0];
    const fire = call?.[2] as (() => Promise<void>) | undefined;
    await fire?.();

    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:vibe`, "Left", { memberId });
  });

  it("他の接続が残るときは集約結果を Update として即時配信し grace には積まない", async () => {
    const vibes = buildVibes({
      delete: vi.fn(async () => ({ isLast: false, aggregated: "focused" as VibeStatus })),
    });
    const broadcast = vi.fn();
    const grace = buildGrace();
    const usecase = new NotifyVibeLeft(vibes, buildHub(broadcast), grace);

    await usecase.execute({ roomId, memberId, connectionId });

    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:vibe`, "Update", {
      memberId,
      status: "focused",
    });
    expect(broadcast).not.toHaveBeenCalledWith(`room:${roomId}:vibe`, "Left", expect.anything());
    expect(grace.schedule).not.toHaveBeenCalled();
  });
});
