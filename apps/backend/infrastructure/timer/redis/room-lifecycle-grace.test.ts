import { randomUUID } from "node:crypto";
import type { RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisExpiredListener } from "./expired-listener";
import { RedisRoomLifecycleGrace } from "./room-lifecycle-grace";

const REDIS_URL = process.env.REDIS_URL;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const newRoomId = () => `room-${randomUUID().replace(/-/g, "")}` as RoomId;

/**
 * 実 Redis に接続して `RedisRoomLifecycleGrace` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`SET PX graceMs` と expired notification + オーナー印 GET の往復が in-memory と等価な fire 配信を生むことを確認する
 * テスト時間短縮のため `override(500)` で猶予を 500ms に縮める
 */
describe.skipIf(!REDIS_URL)("RedisRoomLifecycleGrace", () => {
  let listener: RedisExpiredListener;
  let grace: RedisRoomLifecycleGrace;

  beforeEach(async () => {
    listener = new RedisExpiredListener(REDIS_URL as string);
    await listener.onModuleInit();
    grace = new RedisRoomLifecycleGrace(REDIS_URL as string, listener);
    grace.override(500);
  });

  afterEach(async () => {
    await grace.onModuleDestroy();
    await listener.onModuleDestroy();
  });

  it("予約は猶予経過後に発火を実行する", async () => {
    const fire = vi.fn(async () => undefined);
    grace.schedule(newRoomId(), fire);

    await sleep(1200);

    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("猶予中に取り消すと発火しない", async () => {
    const roomId = newRoomId();
    const fire = vi.fn(async () => undefined);
    grace.schedule(roomId, fire);

    grace.cancel(roomId);
    await sleep(1200);

    expect(fire).not.toHaveBeenCalled();
  });

  it("予約していないルームの取り消しは無視される", () => {
    expect(() => grace.cancel(newRoomId())).not.toThrow();
  });

  it("複数 instance が同じルームを予約しても発火するのは 1 instance だけ", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherGrace = new RedisRoomLifecycleGrace(REDIS_URL as string, otherListener);
    otherGrace.override(500);

    try {
      const roomId = newRoomId();
      const fireA = vi.fn(async () => undefined);
      const fireB = vi.fn(async () => undefined);

      grace.schedule(roomId, fireA);
      otherGrace.schedule(roomId, fireB);

      await sleep(1200);

      expect(fireA.mock.calls.length + fireB.mock.calls.length).toBe(1);
    } finally {
      await otherGrace.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });

  it("片側だけ予約しても両 instance のリスナーが受信し予約した側が必ず発火する", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherGrace = new RedisRoomLifecycleGrace(REDIS_URL as string, otherListener);
    otherGrace.override(500);

    try {
      const roomId = newRoomId();
      const fire = vi.fn(async () => undefined);

      grace.schedule(roomId, fire);

      await sleep(1200);

      expect(fire).toHaveBeenCalledTimes(1);
    } finally {
      await otherGrace.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });
});
