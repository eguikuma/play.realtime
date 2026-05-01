import { type MemberId, Room, type RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { RoomRepository } from "../../domain/room";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { CreateRoom } from "./create.usecase";

const roomId = "room-abc-1234" as RoomId;
const hostId = "member-host" as MemberId;

describe("CreateRoom", () => {
  it("ホストを最初のメンバーとしてルームに登録する", async () => {
    const save = vi.fn();
    const rooms = { find: vi.fn(), save } as RoomRepository;
    const ids = {
      room: vi.fn(() => roomId),
      member: vi.fn(() => hostId),
      murmur: vi.fn(),
      connection: vi.fn(),
    } as unknown as NanoidIdGenerator;
    const usecase = new CreateRoom(rooms, ids);

    const result = await usecase.execute({ hostName: "alice" });

    expect(Room.safeParse(result.room).success).toBe(true);
    expect(result.room.hostMemberId).toBe(hostId);
    expect(result.room.members).toHaveLength(1);
    expect(result.member.id).toBe(hostId);
    expect(result.member.name).toBe("alice");
    expect(save).toHaveBeenCalledWith(result.room);
  });
});
