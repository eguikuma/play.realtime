import { type MemberId, Murmur, type MurmurId, Room, type RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { MurmurRepository } from "../../domain/murmur";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import type { MurmurBroadcaster } from "./broadcaster";
import { PostMurmur } from "./post.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const murmurId = "murmur-1" as MurmurId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: memberId,
    members: [{ id: memberId, name: "alice", joinedAt: "2026-04-18T12:00:00.000Z" }],
    createdAt: "2026-04-18T12:00:00.000Z",
  });

const buildIds = (): NanoidIdGenerator =>
  ({
    murmur: vi.fn(() => murmurId),
    room: vi.fn(),
    member: vi.fn(),
    connection: vi.fn(),
  }) as unknown as NanoidIdGenerator;

const buildBroadcaster = (broadcast = vi.fn()): MurmurBroadcaster =>
  ({ broadcast }) as unknown as MurmurBroadcaster;

describe("PostMurmur", () => {
  it("存在しないルームへの投稿は RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const murmurs = { save: vi.fn(), latest: vi.fn(), remove: vi.fn() } as MurmurRepository;
    const usecase = new PostMurmur(rooms, murmurs, buildIds(), buildBroadcaster());

    await expect(usecase.execute({ roomId, memberId, text: "hi" })).rejects.toBeInstanceOf(
      RoomNotFound,
    );
  });

  it("投稿成功時に一言をルームに記録する", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const save = vi.fn();
    const murmurs = { save, latest: vi.fn(), remove: vi.fn() } as MurmurRepository;
    const usecase = new PostMurmur(rooms, murmurs, buildIds(), buildBroadcaster());

    const result = await usecase.execute({ roomId, memberId, text: "good morning" });

    expect(Murmur.safeParse(result).success).toBe(true);
    expect(save).toHaveBeenCalledWith(result);
  });

  it("投稿成功時に一言を購読者全員へ即時配信する", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const murmurs = { save: vi.fn(), latest: vi.fn(), remove: vi.fn() } as MurmurRepository;
    const broadcast = vi.fn();
    const usecase = new PostMurmur(rooms, murmurs, buildIds(), buildBroadcaster(broadcast));

    const result = await usecase.execute({ roomId, memberId, text: "good morning" });

    expect(broadcast).toHaveBeenCalledWith(`room:${roomId}:murmur`, "Posted", result, result.id);
  });
});
