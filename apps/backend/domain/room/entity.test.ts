import { Member, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { create, join, leave } from "./entity";

const roomId = RoomId.parse("test-room-12");
const createdAt = "2026-04-18T00:00:00.000Z";
const host = Member.parse({
  id: "host-1",
  name: "alice",
  joinedAt: createdAt,
});
const guest = Member.parse({
  id: "guest-1",
  name: "bob",
  joinedAt: "2026-04-18T00:10:00.000Z",
});

describe("create", () => {
  it("ホストを最初のメンバーとしてルームに登録する", () => {
    const room = create({ id: roomId, host, createdAt });

    expect(room.id).toBe(roomId);
    expect(room.hostMemberId).toBe(host.id);
    expect(room.members).toEqual([host]);
    expect(room.createdAt).toBe(createdAt);
  });
});

describe("join", () => {
  it("新しいメンバーがルームに参加する", () => {
    const room = create({ id: roomId, host, createdAt });

    const updated = join(room, guest);

    expect(updated.members).toHaveLength(2);
    expect(updated.members).toContainEqual(guest);
  });

  it("既に参加しているメンバーが再度参加しても二重登録にならない", () => {
    const room = create({ id: roomId, host, createdAt });

    const same = join(room, host);

    expect(same).toBe(room);
    expect(same.members).toHaveLength(1);
  });
});

describe("leave", () => {
  it("指定したメンバーがルームから退出する", () => {
    const room = create({ id: roomId, host, createdAt });
    const withGuest = join(room, guest);

    const afterLeave = leave(withGuest, guest.id);

    expect(afterLeave.members).toEqual([host]);
  });

  it("存在しない id を指定してもルームの状態は変わらない", () => {
    const room = create({ id: roomId, host, createdAt });
    const unknown = MemberId.parse("unknown-id");

    const afterLeave = leave(room, unknown);

    expect(afterLeave.members).toEqual([host]);
  });
});
