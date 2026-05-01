import { randomUUID } from "node:crypto";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RedisHallwayConnectionCounter } from "./hallway-connection-counter";

const REDIS_URL = process.env.REDIS_URL;

const newRoomId = () => `room-${randomUUID().replace(/-/g, "")}` as RoomId;
const newMemberId = () => `member-${randomUUID().replace(/-/g, "")}` as MemberId;

/**
 * 実 Redis に接続して `RedisHallwayConnectionCounter` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`HINCRBY` の戻り値で `isFirst` / `isLast` を判定する流れと、`HDEL` で 0 field 掃除と負値ガードが in-memory と等価であることを確認する
 */
describe.skipIf(!REDIS_URL)("RedisHallwayConnectionCounter", () => {
  let counter: RedisHallwayConnectionCounter;

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    counter = new RedisHallwayConnectionCounter(REDIS_URL as string, { keyPrefix });
  });

  afterEach(async () => {
    await counter.onModuleDestroy();
  });

  it("初回の紐付けは isFirst を返す", async () => {
    expect(await counter.attach(newRoomId(), newMemberId())).toEqual({ isFirst: true });
  });

  it("2 本目以降の紐付けは isFirst を返さない", async () => {
    const roomId = newRoomId();
    const memberId = newMemberId();

    await counter.attach(roomId, memberId);
    expect(await counter.attach(roomId, memberId)).toEqual({ isFirst: false });
  });

  it("1 本だけ接続中の解除は isLast を返す", async () => {
    const roomId = newRoomId();
    const memberId = newMemberId();

    await counter.attach(roomId, memberId);
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });

  it("複数接続のうち 1 本を解除しても isLast を返さず残りの本数を保持する", async () => {
    const roomId = newRoomId();
    const memberId = newMemberId();

    await counter.attach(roomId, memberId);
    await counter.attach(roomId, memberId);
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: false });
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });

  it("attach 無しでの detach も負値を残さず isLast を返す", async () => {
    expect(await counter.detach(newRoomId(), newMemberId())).toEqual({ isLast: true });
  });
});
