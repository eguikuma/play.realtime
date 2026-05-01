import {
  type BgmState,
  type MemberId,
  Room,
  type RoomId,
  type TrackId,
} from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { BgmRepository } from "../../domain/bgm";
import { UndoUnavailable } from "../../domain/bgm";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { SseHub } from "../../infrastructure/transport/sse";
import { UndoBgm } from "./undo.usecase";

const roomId = "room-abc-1234" as RoomId;
const alice = "member-alice" as MemberId;
const bob = "member-bob" as MemberId;
const now = new Date("2026-04-22T10:00:05.000Z");

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: alice,
    members: [
      { id: alice, name: "alice", joinedAt: "2026-04-22T10:00:00.000Z" },
      { id: bob, name: "bob", joinedAt: "2026-04-22T10:00:00.000Z" },
    ],
    createdAt: "2026-04-22T10:00:00.000Z",
  });

const buildBgms = (initial: BgmState | null): BgmRepository => ({
  get: vi.fn(async () => initial),
  save: vi.fn(),
});

const buildHub = (broadcast = vi.fn()): SseHub =>
  ({ broadcast, attach: vi.fn() }) as unknown as SseHub;

const blues = "Blues" as TrackId;
const danceNight = "DanceNight" as TrackId;
const existing: BgmState = {
  current: {
    trackId: danceNight,
    setBy: bob,
    setAt: "2026-04-22T10:00:00.000Z",
  },
  undoable: {
    until: "2026-04-22T10:00:10.000Z",
    previous: {
      trackId: blues,
      setBy: alice,
      setAt: "2026-04-22T09:00:00.000Z",
    },
    byMemberId: bob,
  },
};

describe("UndoBgm", () => {
  it("存在しないルームに対する undo は RoomNotFound を投げる", async () => {
    const rooms = { find: vi.fn(async () => null), save: vi.fn() } as RoomRepository;
    const usecase = new UndoBgm(rooms, buildBgms(existing), buildHub());

    await expect(usecase.execute({ roomId, memberId: alice, now })).rejects.toBeInstanceOf(
      RoomNotFound,
    );
  });

  it("他 member の undo は previous に戻した state を Changed で配信する", async () => {
    const rooms = { find: vi.fn(async () => buildRoom()), save: vi.fn() } as RoomRepository;
    const bgms = buildBgms(existing);
    const broadcast = vi.fn();
    const usecase = new UndoBgm(rooms, bgms, buildHub(broadcast));

    const result = await usecase.execute({ roomId, memberId: alice, now });

    expect(result.current).toEqual(existing.undoable?.previous);
    expect(result.undoable).toBeNull();
    expect(bgms.save).toHaveBeenCalledWith(roomId, result);
    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:bgm`, "Changed", { state: result });
  });

  it("domain.undo が投げた Error はそのまま呼び出し側に伝わる", async () => {
    const rooms = { find: vi.fn(async () => buildRoom()), save: vi.fn() } as RoomRepository;
    const empty: BgmState = { current: null, undoable: null };
    const usecase = new UndoBgm(rooms, buildBgms(empty), buildHub());

    await expect(usecase.execute({ roomId, memberId: alice, now })).rejects.toBeInstanceOf(
      UndoUnavailable,
    );
  });
});
