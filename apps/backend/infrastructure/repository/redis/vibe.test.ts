import { randomUUID } from "node:crypto";
import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RedisVibeRepository } from "./vibe";

const REDIS_URL = process.env.REDIS_URL;

/**
 * 実 Redis に接続して `RedisVibeRepository` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`HSET` `HVALS` `SMEMBERS` を経由した集約結果が in-memory と等価であることを確認する
 */
describe.skipIf(!REDIS_URL)("RedisVibeRepository", () => {
  let repository: RedisVibeRepository;

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    repository = new RedisVibeRepository(REDIS_URL as string, { keyPrefix });
  });

  afterEach(async () => {
    await repository.onModuleDestroy();
  });

  it("保存した接続のステータスがスナップショットに集約されて現れる", async () => {
    const roomId = "room-redis-vibe-1" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");

    expect(await repository.snapshot(roomId)).toEqual([{ memberId, status: "present" }]);
  });

  it("初回接続の保存では `isFirst` を返し 2 本目以降は返さない", async () => {
    const roomId = "room-redis-vibe-2" as RoomId;
    const memberId = "member-alice" as MemberId;

    const first = await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const second = await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");

    expect(first.isFirst).toBe(true);
    expect(second.isFirst).toBe(false);
  });

  it("同じメンバーが複数の接続を持つときスナップショットは集約後の単一ステータスを返す", async () => {
    const roomId = "room-redis-vibe-3" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "focused");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "present");

    expect(await repository.snapshot(roomId)).toEqual([{ memberId, status: "present" }]);
  });

  it("既存接続を更新すると集約結果を書き換えて `updated` 真を返す", async () => {
    const roomId = "room-redis-vibe-4" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const result = await repository.update(roomId, memberId, "conn-1" as ConnectionId, "focused");

    expect(result).toEqual({ updated: true, aggregated: "focused" });
    expect(await repository.get(roomId, memberId)).toBe("focused");
  });

  it("台帳に居ない接続への更新は何もせず `updated` 偽を返す", async () => {
    const roomId = "room-redis-vibe-5" as RoomId;
    const memberId = "member-alice" as MemberId;

    const result = await repository.update(
      roomId,
      memberId,
      "conn-phantom" as ConnectionId,
      "present",
    );

    expect(result).toEqual({ updated: false, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除済み接続への更新は復活させずに `updated` 偽を返す", async () => {
    const roomId = "room-redis-vibe-6" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.delete(roomId, memberId, "conn-1" as ConnectionId);
    const result = await repository.update(roomId, memberId, "conn-1" as ConnectionId, "focused");

    expect(result).toEqual({ updated: false, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除は最後の接続で `isLast` を返し集約結果は `null` になる", async () => {
    const roomId = "room-redis-vibe-7" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const result = await repository.delete(roomId, memberId, "conn-1" as ConnectionId);

    expect(result).toEqual({ isLast: true, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除で接続が残っていれば `isLast` を返さず残りの集約結果を返す", async () => {
    const roomId = "room-redis-vibe-8" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");
    const result = await repository.delete(roomId, memberId, "conn-1" as ConnectionId);

    expect(result).toEqual({ isLast: false, aggregated: "focused" });
  });

  it("取得はメンバーの全接続を集約して返し接続が無ければ `null` を返す", async () => {
    const roomId = "room-redis-vibe-9" as RoomId;
    const aliceId = "member-alice" as MemberId;
    const bobId = "member-bob" as MemberId;

    await repository.save(roomId, aliceId, "conn-1" as ConnectionId, "focused");
    await repository.save(roomId, aliceId, "conn-2" as ConnectionId, "present");

    expect(await repository.get(roomId, aliceId)).toBe("present");
    expect(await repository.get(roomId, bobId)).toBeNull();
  });

  it("ルーム単位の取り除きで配下の全接続データが破棄される", async () => {
    const roomId = "room-redis-vibe-10" as RoomId;
    const keep = "room-redis-vibe-keep" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");
    await repository.save(keep, memberId, "conn-3" as ConnectionId, "present");

    await repository.remove(roomId);

    expect(await repository.snapshot(roomId)).toEqual([]);
    expect(await repository.get(roomId, memberId)).toBeNull();
    expect(await repository.snapshot(keep)).toEqual([{ memberId, status: "present" }]);
  });
});
