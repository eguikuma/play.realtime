import { Murmur, type RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryMurmurRepository } from "./murmur";

const buildMurmur = (roomId: RoomId, text: string, sequence: number): Murmur =>
  Murmur.parse({
    id: `murmur-${sequence}`,
    roomId,
    memberId: "member-test",
    text,
    postedAt: new Date(2026, 3, 18, 12, 0, sequence).toISOString(),
  });

describe("InMemoryMurmurRepository", () => {
  it("保存した一言を投稿順に取り出せる", async () => {
    const repository = new InMemoryMurmurRepository();
    const roomId = "room-abc-1234" as RoomId;

    await repository.save(buildMurmur(roomId, "first", 1));
    await repository.save(buildMurmur(roomId, "second", 2));

    const items = await repository.latest(roomId, 10);

    expect(items.map((each) => each.text)).toEqual(["first", "second"]);
  });

  it("指定件数だけ直近の一言を返す", async () => {
    const repository = new InMemoryMurmurRepository();
    const roomId = "room-abc-1234" as RoomId;

    for (let sequence = 1; sequence <= 5; sequence += 1) {
      await repository.save(buildMurmur(roomId, `word-${sequence}`, sequence));
    }

    const items = await repository.latest(roomId, 2);

    expect(items.map((each) => each.text)).toEqual(["word-4", "word-5"]);
  });

  it("別のルームに投稿した一言は混ざらない", async () => {
    const repository = new InMemoryMurmurRepository();
    const roomA = "room-abc-aaaa" as RoomId;
    const roomB = "room-abc-bbbb" as RoomId;

    await repository.save(buildMurmur(roomA, "a", 1));
    await repository.save(buildMurmur(roomB, "b", 2));

    const a = await repository.latest(roomA, 10);
    const b = await repository.latest(roomB, 10);

    expect(a.map((each) => each.text)).toEqual(["a"]);
    expect(b.map((each) => each.text)).toEqual(["b"]);
  });

  it("ルーム単位の取り除きで配下の投稿が破棄される", async () => {
    const repository = new InMemoryMurmurRepository();
    const roomId = "room-abc-aaaa" as RoomId;
    const keep = "room-abc-bbbb" as RoomId;

    await repository.save(buildMurmur(roomId, "x", 1));
    await repository.save(buildMurmur(roomId, "y", 2));
    await repository.save(buildMurmur(keep, "z", 3));

    await repository.remove(roomId);

    expect(await repository.latest(roomId, 10)).toEqual([]);
    expect((await repository.latest(keep, 10)).map((each) => each.text)).toEqual(["z"]);
  });

  it("存在しないルームを取り除いても例外を投げない", async () => {
    const repository = new InMemoryMurmurRepository();

    await expect(repository.remove("room-abc-zzzz" as RoomId)).resolves.toBeUndefined();
  });
});
