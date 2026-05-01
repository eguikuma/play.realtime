import { type MemberId, Room, type RoomId, type Vibe } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { VibeRepository } from "../../domain/vibe";
import { GetVibeSnapshot } from "./get-snapshot.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: memberId,
    members: [{ id: memberId, name: "alice", joinedAt: "2026-04-19T10:00:00.000Z" }],
    createdAt: "2026-04-19T10:00:00.000Z",
  });

const buildVibes = (snapshot: Vibe[] = []): VibeRepository => ({
  save: vi.fn(),
  delete: vi.fn(),
  snapshot: vi.fn(async () => snapshot),
  get: vi.fn(),
});

describe("GetVibeSnapshot", () => {
  it("存在しないルームでは RoomNotFound を投げる", async () => {
    const rooms = { find: vi.fn(async () => null), save: vi.fn() } as RoomRepository;
    const usecase = new GetVibeSnapshot(rooms, buildVibes());

    await expect(usecase.execute({ roomId })).rejects.toBeInstanceOf(RoomNotFound);
  });

  it("メンバー一覧と現在オンラインのステータス一覧をまとめて返す", async () => {
    const room = buildRoom();
    const rooms = { find: vi.fn(async () => room), save: vi.fn() } as RoomRepository;
    const statuses: Vibe[] = [{ memberId, status: "present" }];
    const usecase = new GetVibeSnapshot(rooms, buildVibes(statuses));

    const result = await usecase.execute({ roomId });

    expect(result.members).toBe(room.members);
    expect(result.statuses).toBe(statuses);
  });
});
