import type { ConnectionId, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { VibeRepository } from "../../domain/vibe";
import type { VibeBroadcaster } from "./broadcaster";
import { NotifyVibeLeft } from "./notify-left.usecase";
import { VibePresenceGrace } from "./presence-grace";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const connectionId = "conn-1" as ConnectionId;

const buildVibes = (overrides: Partial<VibeRepository> = {}): VibeRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(async () => ({ isLast: true, aggregated: null })),
  snapshot: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  ...overrides,
});

const buildBroadcaster = (
  overrides: Partial<Record<keyof VibeBroadcaster, ReturnType<typeof vi.fn>>> = {},
): VibeBroadcaster =>
  ({
    joined: vi.fn(),
    left: vi.fn(),
    updated: vi.fn(),
    ...overrides,
  }) as unknown as VibeBroadcaster;

const buildGrace = (): VibePresenceGrace =>
  ({ cancel: vi.fn(), schedule: vi.fn() }) as unknown as VibePresenceGrace;

describe("NotifyVibeLeft", () => {
  it("最後の接続が消えると猶予を経て Left を購読者全員に配信する", async () => {
    const vibes = buildVibes();
    const broadcaster = buildBroadcaster();
    const grace = buildGrace();
    const usecase = new NotifyVibeLeft(vibes, broadcaster, grace);

    await usecase.execute({ roomId, memberId, connectionId });

    expect(vibes.delete).toHaveBeenCalledWith(roomId, memberId, connectionId);
    expect(grace.schedule).toHaveBeenCalledWith(roomId, memberId, expect.any(Function));
    expect(broadcaster.left).not.toHaveBeenCalled();

    const call = (grace.schedule as ReturnType<typeof vi.fn>).mock.calls[0];
    const fire = call?.[2] as (() => Promise<void>) | undefined;
    await fire?.();

    expect(broadcaster.left).toHaveBeenCalledWith(roomId, { memberId });
  });

  it("他の接続が残るときは集約結果を Updated として即時配信し猶予予約には積まない", async () => {
    const vibes = buildVibes({
      delete: vi.fn(async () => ({ isLast: false, aggregated: "focused" as VibeStatus })),
    });
    const broadcaster = buildBroadcaster();
    const grace = buildGrace();
    const usecase = new NotifyVibeLeft(vibes, broadcaster, grace);

    await usecase.execute({ roomId, memberId, connectionId });

    expect(broadcaster.updated).toHaveBeenCalledWith(roomId, {
      memberId,
      status: "focused",
    });
    expect(broadcaster.left).not.toHaveBeenCalled();
    expect(grace.schedule).not.toHaveBeenCalled();
  });
});
