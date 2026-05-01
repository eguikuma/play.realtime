import { Member, RoomId } from "@play.realtime/contracts";
import { beforeEach, describe, expect, it } from "vitest";
import { create } from "../../../domain/room";
import { InMemoryRoomRepository } from "./room";

const roomId = RoomId.parse("repo-test-1");
const createdAt = "2026-04-18T00:00:00.000Z";
const host = Member.parse({
  id: "host-1",
  name: "alice",
  joinedAt: createdAt,
});

describe("InMemoryRoomRepository", () => {
  let repository: InMemoryRoomRepository;

  beforeEach(() => {
    repository = new InMemoryRoomRepository();
  });

  it("新規のルームを保存できる", async () => {
    const room = create({ id: roomId, host, createdAt });

    await repository.save(room);

    expect(await repository.find(roomId)).toEqual(room);
  });

  it("同じ id のルームを上書き保存できる", async () => {
    const first = create({ id: roomId, host, createdAt });
    const second = create({ id: roomId, host, createdAt: "2026-04-18T01:00:00.000Z" });

    await repository.save(first);
    await repository.save(second);

    expect(await repository.find(roomId)).toEqual(second);
  });

  it("保存済みのルームを取得できる", async () => {
    const room = create({ id: roomId, host, createdAt });
    await repository.save(room);

    const found = await repository.find(roomId);

    expect(found).toEqual(room);
  });

  it("存在しない id には null を返す", async () => {
    const unknown = RoomId.parse("unknown-room-9999");

    const found = await repository.find(unknown);

    expect(found).toBeNull();
  });
});
