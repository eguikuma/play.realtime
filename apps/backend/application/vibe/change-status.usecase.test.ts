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
import type { SseHub } from "../../infrastructure/transport/sse";
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
  save: vi.fn(async () => ({ isFirst: false, aggregated: "focused" as VibeStatus })),
  delete: vi.fn(),
  snapshot: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  ...overrides,
});

const buildHub = (broadcast = vi.fn()): SseHub =>
  ({ broadcast, attach: vi.fn() }) as unknown as SseHub;

describe("ChangeVibeStatus", () => {
  it("存在しないルームへの変更は RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new ChangeVibeStatus(rooms, buildVibes(), buildHub());

    await expect(
      usecase.execute({ roomId, memberId, connectionId, status: "focused" }),
    ).rejects.toBeInstanceOf(RoomNotFound);
  });

  it("接続単位でステータスを保存し集約結果を Update として購読者全員に配信する", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const vibes = buildVibes({
      save: vi.fn(async () => ({ isFirst: false, aggregated: "present" as VibeStatus })),
    });
    const broadcast = vi.fn();
    const usecase = new ChangeVibeStatus(rooms, vibes, buildHub(broadcast));

    await usecase.execute({ roomId, memberId, connectionId, status: "focused" });

    expect(vibes.save).toHaveBeenCalledWith(roomId, memberId, connectionId, "focused");
    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:vibe`, "Update", {
      memberId,
      status: "present",
    });
  });
});
