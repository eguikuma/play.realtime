import {
  type ConnectionId,
  type MemberId,
  Room,
  type RoomId,
  type VibeStatus,
} from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { VibeRepository } from "../../domain/vibe";
import type { VibeBroadcaster } from "./broadcaster";
import { ChangeVibeStatus } from "./change-status.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const connectionId = "conn-1" as ConnectionId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: memberId,
    members: [{ id: memberId, name: "alice", joinedAt: "2026-04-19T10:00:00.000Z" }],
    createdAt: "2026-04-19T10:00:00.000Z",
  });

const buildVibes = (overrides: Partial<VibeRepository> = {}): VibeRepository => ({
  save: vi.fn(),
  update: vi.fn(async () => ({ updated: true, aggregated: "focused" as VibeStatus })),
  delete: vi.fn(),
  snapshot: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  ...overrides,
});

const buildBroadcaster = (broadcast = vi.fn()): VibeBroadcaster =>
  ({ broadcast }) as unknown as VibeBroadcaster;

describe("ChangeVibeStatus", () => {
  it("存在しないルームへの変更は RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new ChangeVibeStatus(rooms, buildVibes(), buildBroadcaster());

    await expect(
      usecase.execute({ roomId, memberId, connectionId, status: "focused" }),
    ).rejects.toBeInstanceOf(RoomNotFound);
  });

  it("既存接続のステータスを書き換え 集約結果を Update として購読者全員に配信する", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const vibes = buildVibes({
      update: vi.fn(async () => ({ updated: true, aggregated: "present" as VibeStatus })),
    });
    const broadcast = vi.fn();
    const usecase = new ChangeVibeStatus(rooms, vibes, buildBroadcaster(broadcast));

    await usecase.execute({ roomId, memberId, connectionId, status: "focused" });

    expect(vibes.update).toHaveBeenCalledWith(roomId, memberId, connectionId, "focused");
    expect(vibes.save).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:vibe`, "Update", {
      memberId,
      status: "present",
    });
  });

  it("既に閉じられた接続への遅延 POST は 何も書き込まず配信もしない", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const vibes = buildVibes({
      update: vi.fn(async () => ({ updated: false, aggregated: null })),
    });
    const broadcast = vi.fn();
    const usecase = new ChangeVibeStatus(rooms, vibes, buildBroadcaster(broadcast));

    await usecase.execute({ roomId, memberId, connectionId, status: "focused" });

    expect(vibes.update).toHaveBeenCalledWith(roomId, memberId, connectionId, "focused");
    expect(vibes.save).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
  });
});
