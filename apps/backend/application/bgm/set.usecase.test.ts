import {
  type BgmState,
  type MemberId,
  Room,
  type RoomId,
  type TrackId,
} from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { BgmRepository } from "../../domain/bgm";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { BgmBroadcaster } from "./broadcaster";
import { SetBgm } from "./set.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const trackId = "Blues" as TrackId;
const now = new Date("2026-04-22T10:00:00.000Z");

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: memberId,
    members: [{ id: memberId, name: "alice", joinedAt: "2026-04-22T10:00:00.000Z" }],
    createdAt: "2026-04-22T10:00:00.000Z",
  });

const buildBgms = (state: BgmState | null = null): BgmRepository => ({
  get: vi.fn(async () => state),
  save: vi.fn(),
  remove: vi.fn(),
});

const buildBroadcaster = (
  overrides: Partial<Record<keyof BgmBroadcaster, ReturnType<typeof vi.fn>>> = {},
): BgmBroadcaster =>
  ({
    changed: vi.fn(),
    ...overrides,
  }) as unknown as BgmBroadcaster;

describe("SetBgm", () => {
  it("存在しないルームに対する set は RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new SetBgm(rooms, buildBgms(), buildBroadcaster());

    await expect(usecase.execute({ roomId, memberId, trackId, now })).rejects.toBeInstanceOf(
      RoomNotFound,
    );
  });

  it("新 state を save し Changed event で購読者全員に配信する", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const bgms = buildBgms();
    const broadcaster = buildBroadcaster();
    const usecase = new SetBgm(rooms, bgms, broadcaster);

    const result = await usecase.execute({ roomId, memberId, trackId, now });

    expect(result.current?.trackId).toBe(trackId);
    expect(result.undoable?.byMemberId).toBe(memberId);
    expect(bgms.save).toHaveBeenCalledWith(roomId, result);
    expect(broadcaster.changed).toHaveBeenCalledWith(roomId, { state: result });
  });
});
