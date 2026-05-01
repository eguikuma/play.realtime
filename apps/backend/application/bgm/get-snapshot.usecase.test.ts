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
import { GetBgmSnapshot } from "./get-snapshot.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: memberId,
    members: [{ id: memberId, name: "alice", joinedAt: "2026-04-22T10:00:00.000Z" }],
    createdAt: "2026-04-22T10:00:00.000Z",
  });

const buildBgms = (state: BgmState | null): BgmRepository => ({
  get: vi.fn(async () => state),
  save: vi.fn(),
  remove: vi.fn(),
});

describe("GetBgmSnapshot", () => {
  it("存在しないルームでは RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetBgmSnapshot(rooms, buildBgms(null));

    await expect(usecase.execute({ roomId })).rejects.toBeInstanceOf(RoomNotFound);
  });

  it("repository に entry が無い room では empty state を返す", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetBgmSnapshot(rooms, buildBgms(null));

    const result = await usecase.execute({ roomId });

    expect(result.state).toEqual({ current: null, undoable: null });
  });

  it("保存済み state はそのまま snapshot として返す", async () => {
    const existing: BgmState = {
      current: {
        trackId: "Blues" as TrackId,
        setBy: memberId,
        setAt: "2026-04-22T10:00:00.000Z",
      },
      undoable: null,
    };
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetBgmSnapshot(rooms, buildBgms(existing));

    const result = await usecase.execute({ roomId });

    expect(result.state).toEqual(existing);
  });
});
