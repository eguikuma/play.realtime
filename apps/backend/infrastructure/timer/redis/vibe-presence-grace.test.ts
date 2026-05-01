import { randomUUID } from "node:crypto";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisExpiredListener } from "./expired-listener";
import { RedisVibePresenceGrace } from "./vibe-presence-grace";

const REDIS_URL = process.env.REDIS_URL;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const newRoomId = () => `room-${randomUUID().replace(/-/g, "")}` as RoomId;
const newMemberId = () => `member-${randomUUID().replace(/-/g, "")}` as MemberId;

/**
 * 実 Redis に接続して `RedisVibePresenceGrace` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`SET PX 1500 NX` と expired notification + オーナー印 GET の往復が in-memory と等価な fire 配信を生むことを確認する
 * 1500ms TTL に対して安全側に余裕をもった実時間 sleep で fire 検出する
 */
describe.skipIf(!REDIS_URL)("RedisVibePresenceGrace", () => {
  let listener: RedisExpiredListener;
  let grace: RedisVibePresenceGrace;

  beforeEach(async () => {
    listener = new RedisExpiredListener(REDIS_URL as string);
    await listener.onModuleInit();
    grace = new RedisVibePresenceGrace(REDIS_URL as string, listener);
  });

  afterEach(async () => {
    await grace.onModuleDestroy();
    await listener.onModuleDestroy();
  });

  it("予約は 1500ms 後に発火を実行する", async () => {
    const fire = vi.fn();
    grace.schedule(newRoomId(), newMemberId(), fire);

    await sleep(2200);

    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("取り消しは保留中の予約を取り消し true を返し発火しない", async () => {
    const roomId = newRoomId();
    const memberId = newMemberId();
    const fire = vi.fn();
    grace.schedule(roomId, memberId, fire);

    const cancelled = grace.cancel(roomId, memberId);
    await sleep(2200);

    expect(cancelled).toBe(true);
    expect(fire).not.toHaveBeenCalled();
  });

  it("予約が無ければ取り消しは false を返す", () => {
    expect(grace.cancel(newRoomId(), newMemberId())).toBe(false);
  });

  it("複数 instance が同じキーを予約しても発火するのは 1 instance だけ", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherGrace = new RedisVibePresenceGrace(REDIS_URL as string, otherListener);

    try {
      const roomId = newRoomId();
      const memberId = newMemberId();
      const fireA = vi.fn();
      const fireB = vi.fn();

      grace.schedule(roomId, memberId, fireA);
      otherGrace.schedule(roomId, memberId, fireB);

      await sleep(2200);

      expect(fireA.mock.calls.length + fireB.mock.calls.length).toBe(1);
    } finally {
      await otherGrace.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });

  it("片側だけ予約しても両 instance のリスナーが受信し予約した側が必ず発火する", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherGrace = new RedisVibePresenceGrace(REDIS_URL as string, otherListener);

    try {
      const roomId = newRoomId();
      const memberId = newMemberId();
      const fire = vi.fn();

      grace.schedule(roomId, memberId, fire);

      await sleep(2200);

      expect(fire).toHaveBeenCalledTimes(1);
    } finally {
      await otherGrace.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });
});
