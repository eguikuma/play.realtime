import { randomUUID } from "node:crypto";
import { Murmur, type RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RedisMurmurRepository } from "./murmur";

const REDIS_URL = process.env.REDIS_URL;

const buildMurmur = (roomId: RoomId, text: string, sequence: number): Murmur =>
  Murmur.parse({
    id: `murmur-${sequence}`,
    roomId,
    memberId: "member-test",
    text,
    postedAt: new Date(2026, 3, 18, 12, 0, sequence).toISOString(),
  });

/**
 * 実 Redis に接続して `RedisMurmurRepository` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、List の順序保持と切り出しが in-memory と同じセマンティクスかを確認する
 */
describe.skipIf(!REDIS_URL)("RedisMurmurRepository", () => {
  let repository: RedisMurmurRepository;

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    repository = new RedisMurmurRepository(REDIS_URL as string, { keyPrefix });
  });

  afterEach(async () => {
    await repository.onModuleDestroy();
  });

  it("保存した一言を投稿順に取り出せる", async () => {
    const roomId = "room-redis-murmur-1" as RoomId;

    await repository.save(buildMurmur(roomId, "first", 1));
    await repository.save(buildMurmur(roomId, "second", 2));

    const items = await repository.latest(roomId, 10);

    expect(items.map((each) => each.text)).toEqual(["first", "second"]);
  });

  it("指定件数だけ直近の一言を返す", async () => {
    const roomId = "room-redis-murmur-2" as RoomId;

    for (let sequence = 1; sequence <= 5; sequence += 1) {
      await repository.save(buildMurmur(roomId, `word-${sequence}`, sequence));
    }

    const items = await repository.latest(roomId, 2);

    expect(items.map((each) => each.text)).toEqual(["word-4", "word-5"]);
  });

  it("別のルームに投稿した一言は混ざらない", async () => {
    const roomA = "room-redis-murmur-a" as RoomId;
    const roomB = "room-redis-murmur-b" as RoomId;

    await repository.save(buildMurmur(roomA, "a", 1));
    await repository.save(buildMurmur(roomB, "b", 2));

    expect((await repository.latest(roomA, 10)).map((each) => each.text)).toEqual(["a"]);
    expect((await repository.latest(roomB, 10)).map((each) => each.text)).toEqual(["b"]);
  });

  it("ルーム単位の取り除きで配下の投稿が破棄される", async () => {
    const roomId = "room-redis-murmur-3" as RoomId;
    const keep = "room-redis-murmur-keep" as RoomId;

    await repository.save(buildMurmur(roomId, "x", 1));
    await repository.save(buildMurmur(roomId, "y", 2));
    await repository.save(buildMurmur(keep, "z", 3));

    await repository.remove(roomId);

    expect(await repository.latest(roomId, 10)).toEqual([]);
    expect((await repository.latest(keep, 10)).map((each) => each.text)).toEqual(["z"]);
  });

  it("`limit` が 0 以下なら空配列を返す", async () => {
    const roomId = "room-redis-murmur-4" as RoomId;
    await repository.save(buildMurmur(roomId, "x", 1));

    expect(await repository.latest(roomId, 0)).toEqual([]);
  });
});
