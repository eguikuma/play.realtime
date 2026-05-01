import type { ConnectionId, Member, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { VibeRepository } from "../../domain/vibe";
import type { VibeBroadcaster } from "./broadcaster";
import { NotifyVibeJoined } from "./notify-joined.usecase";
import { VibePresenceGrace } from "./presence-grace";

const roomId = "room-abc-1234" as RoomId;
const connectionId = "conn-1" as ConnectionId;
const member: Member = {
  id: "member-alice" as MemberId,
  name: "alice",
  joinedAt: "2026-04-19T10:00:00.000Z",
};

const buildVibes = (overrides: Partial<VibeRepository> = {}): VibeRepository => ({
  save: vi.fn(async () => ({ isFirst: true, aggregated: "present" as VibeStatus })),
  update: vi.fn(),
  delete: vi.fn(),
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

const buildGrace = (cancel: () => boolean = () => false): VibePresenceGrace =>
  ({ cancel: vi.fn(cancel), schedule: vi.fn() }) as unknown as VibePresenceGrace;

describe("NotifyVibeJoined", () => {
  it("初回接続では present として保存し Joined を購読者全員に配信する", async () => {
    const vibes = buildVibes();
    const broadcaster = buildBroadcaster();
    const usecase = new NotifyVibeJoined(vibes, broadcaster, buildGrace());

    await usecase.execute({ roomId, member, connectionId });

    expect(vibes.save).toHaveBeenCalledWith(roomId, member.id, connectionId, "present");
    expect(broadcaster.joined).toHaveBeenCalledWith(roomId, {
      member,
      status: "present",
    });
  });

  it("2 本目以降の接続では集約結果を Updated として配信し Joined は再送しない", async () => {
    const vibes = buildVibes({
      save: vi.fn(async () => ({ isFirst: false, aggregated: "focused" as VibeStatus })),
    });
    const broadcaster = buildBroadcaster();
    const usecase = new NotifyVibeJoined(vibes, broadcaster, buildGrace());

    await usecase.execute({ roomId, member, connectionId });

    expect(broadcaster.updated).toHaveBeenCalledWith(roomId, {
      memberId: member.id,
      status: "focused",
    });
    expect(broadcaster.joined).not.toHaveBeenCalled();
  });

  it("grace 期間中に再接続した場合は Left 予約を cancel し Joined ではなく Updated を配信する", async () => {
    const vibes = buildVibes();
    const broadcaster = buildBroadcaster();
    const grace = buildGrace(() => true);
    const usecase = new NotifyVibeJoined(vibes, broadcaster, grace);

    await usecase.execute({ roomId, member, connectionId });

    expect(grace.cancel).toHaveBeenCalledWith(roomId, member.id);
    expect(broadcaster.updated).toHaveBeenCalledWith(roomId, {
      memberId: member.id,
      status: "present",
    });
    expect(broadcaster.joined).not.toHaveBeenCalled();
  });
});
