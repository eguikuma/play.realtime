import { type MemberId, Room, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { MemberNotFound, RoomNotFound, type RoomRepository } from "../../domain/room";
import { GetRoomMembership } from "./get-membership.usecase";

const roomId = RoomId.parse("room-abc-1234");
const hostId = "member-host" as MemberId;
const otherId = "member-other" as MemberId;

const buildRoom = (): Room =>
  Room.parse({
    id: roomId,
    hostMemberId: hostId,
    members: [{ id: hostId, name: "alice", joinedAt: "2026-04-18T12:00:00.000Z" }],
    createdAt: "2026-04-18T12:00:00.000Z",
  });

describe("GetRoomMembership", () => {
  it("存在しないルームでは RoomNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => null),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetRoomMembership(rooms);

    await expect(usecase.execute({ roomId, memberId: hostId })).rejects.toBeInstanceOf(
      RoomNotFound,
    );
  });

  it("ルームにいないメンバーでは MemberNotFound を投げる", async () => {
    const rooms = {
      find: vi.fn(async () => buildRoom()),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetRoomMembership(rooms);

    await expect(usecase.execute({ roomId, memberId: otherId })).rejects.toBeInstanceOf(
      MemberNotFound,
    );
  });

  it("ルームに所属するメンバーに対してルームとメンバーの両方を返す", async () => {
    const room = buildRoom();
    const rooms = {
      find: vi.fn(async () => room),
      save: vi.fn(),
      remove: vi.fn(),
    } as RoomRepository;
    const usecase = new GetRoomMembership(rooms);

    const result = await usecase.execute({ roomId, memberId: hostId });

    expect(result.room).toEqual(room);
    expect(result.member.id).toBe(hostId);
    expect(result.member.name).toBe("alice");
  });
});
