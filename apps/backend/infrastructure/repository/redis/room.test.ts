import { randomUUID } from "node:crypto";
import { Member, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { create } from "../../../domain/room";
import { RedisRoomRepository } from "./room";

const REDIS_URL = process.env.REDIS_URL;

const roomId = RoomId.parse("repo-redis-room-1");
const createdAt = "2026-04-18T00:00:00.000Z";
const host = Member.parse({ id: "host-1", name: "alice", joinedAt: createdAt });

/**
 * 実 Redis に接続して `RedisRoomRepository` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、ローカル Redis や CI services の起動状態に依存しないようにする
 * 各テストケースは UUID ベースの key prefix で空間を分離して、並列実行時の干渉を避ける
 */
describe.skipIf(!REDIS_URL)("RedisRoomRepository", () => {
  let repository: RedisRoomRepository;

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    repository = new RedisRoomRepository(REDIS_URL as string, { keyPrefix });
  });

  afterEach(async () => {
    await repository.onModuleDestroy();
  });

  it("新規のルームを保存できる", async () => {
    const room = create({ id: roomId, host, createdAt });

    await repository.save(room);

    expect(await repository.find(roomId)).toEqual(room);
  });

  it("同じ `id` のルームを上書き保存できる", async () => {
    const first = create({ id: roomId, host, createdAt });
    const second = create({ id: roomId, host, createdAt: "2026-04-18T01:00:00.000Z" });

    await repository.save(first);
    await repository.save(second);

    expect(await repository.find(roomId)).toEqual(second);
  });

  it("存在しない `id` には `null` を返す", async () => {
    expect(await repository.find(RoomId.parse("repo-redis-room-unknown"))).toBeNull();
  });

  it("保存済みのルームを取り除くと検索は `null` を返す", async () => {
    const room = create({ id: roomId, host, createdAt });
    await repository.save(room);

    await repository.remove(roomId);

    expect(await repository.find(roomId)).toBeNull();
  });

  it("存在しないルームを取り除いても例外を投げない", async () => {
    await expect(
      repository.remove(RoomId.parse("repo-redis-room-unknown")),
    ).resolves.toBeUndefined();
  });
});
