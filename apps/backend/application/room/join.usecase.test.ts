import { type MemberId, Room, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { RoomNotFound, type RoomRepository } from "../../domain/room";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { JoinRoom } from "./join.usecase";

const roomId = RoomId.parse("room-abc-1234");
const hostId = "member-host" as MemberId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: hostId,
    members: [{ id: hostId, name: "alice", joinedAt: "2026-04-18T12:00:00.000Z" }],
    createdAt: "2026-04-18T12:00:00.000Z",
  });

const buildIds = (memberId = "member-bob"): NanoidIdGenerator =>
  ({
    room: vi.fn(),
    member: vi.fn(() => memberId),
    murmur: vi.fn(),
    connection: vi.fn(),
  }) as unknown as NanoidIdGenerator;

describe("JoinRoom", () => {
  it("存在しないルームでは RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new JoinRoom(rooms, buildIds());

    await expect(usecase.execute({ roomId, name: "bob" })).rejects.toBeInstanceOf(RoomNotFound);
  });

  it("新しいメンバーをルームに追加する", async () => {
    const room = buildRoom();
    const rooms = {
      find: vi.fn(async () => room),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new JoinRoom(rooms, buildIds());

    const result = await usecase.execute({ roomId, name: "bob" });

    expect(result.room.members).toHaveLength(2);
    expect(result.room.members[1]?.name).toBe("bob");
    expect(result.member.name).toBe("bob");
  });

  it("入室後のルーム状態を保存する", async () => {
    const room = buildRoom();
    const save = vi.fn();
    const rooms = { find: vi.fn(async () => room), save, remove: vi.fn() } as RoomRepository;
    const usecase = new JoinRoom(rooms, buildIds());

    const { room: updated } = await usecase.execute({ roomId, name: "bob" });

    expect(save).toHaveBeenCalledWith(updated);
  });

  it("既参加メンバー ID を渡されたら新規作成せず既存メンバーを返す", async () => {
    const room = buildRoom();
    const save = vi.fn();
    const rooms = { find: vi.fn(async () => room), save, remove: vi.fn() } as RoomRepository;
    const usecase = new JoinRoom(rooms, buildIds());

    const { member } = await usecase.execute({
      roomId,
      name: "別名でリクエストされても",
      existingMemberId: hostId,
    });

    expect(member.id).toBe(hostId);
    expect(member.name).toBe("alice");
    expect(save).not.toHaveBeenCalled();
  });

  it("既参加メンバー ID がルームに残っていなければ通常どおり新規作成する", async () => {
    const room = buildRoom();
    const save = vi.fn();
    const rooms = { find: vi.fn(async () => room), save, remove: vi.fn() } as RoomRepository;
    const usecase = new JoinRoom(rooms, buildIds("member-new"));

    const { member } = await usecase.execute({
      roomId,
      name: "bob",
      existingMemberId: "member-already-gone" as MemberId,
    });

    expect(member.id).toBe("member-new");
    expect(save).toHaveBeenCalled();
  });
});
