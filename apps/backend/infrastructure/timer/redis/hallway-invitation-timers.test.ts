import { randomUUID } from "node:crypto";
import type { InvitationId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisExpiredListener } from "./expired-listener";
import { RedisHallwayInvitationTimers } from "./hallway-invitation-timers";

const REDIS_URL = process.env.REDIS_URL;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const newInvitationId = () => `inv-${randomUUID().replace(/-/g, "")}` as InvitationId;

/**
 * 実 Redis に接続して `RedisHallwayInvitationTimers` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`SET PX delayMs NX` と expired notification + オーナー印 GET の往復が in-memory と等価な callback 呼出を生むことを確認する
 * `delayMs` は in-memory test の 1000ms と異なり 500ms 程度に縮めて、テスト時間を抑える
 */
describe.skipIf(!REDIS_URL)("RedisHallwayInvitationTimers", () => {
  let listener: RedisExpiredListener;
  let timers: RedisHallwayInvitationTimers;

  beforeEach(async () => {
    listener = new RedisExpiredListener(REDIS_URL as string);
    await listener.onModuleInit();
    timers = new RedisHallwayInvitationTimers(REDIS_URL as string, listener);
  });

  afterEach(async () => {
    await timers.onModuleDestroy();
    await listener.onModuleDestroy();
  });

  it("登録した遅延時間の経過後にコールバックが呼ばれる", async () => {
    const callback = vi.fn();
    timers.schedule(newInvitationId(), 500, callback);

    await sleep(1200);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("取り消すとコールバックは呼ばれない", async () => {
    const id = newInvitationId();
    const callback = vi.fn();
    timers.schedule(id, 500, callback);
    timers.cancel(id);

    await sleep(1200);

    expect(callback).not.toHaveBeenCalled();
  });

  it("存在しない ID を取り消しても無視する", () => {
    expect(() => timers.cancel(newInvitationId())).not.toThrow();
  });

  it("複数 instance が同じ ID を登録してもコールバックを呼ぶのは 1 instance だけ", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherTimers = new RedisHallwayInvitationTimers(REDIS_URL as string, otherListener);

    try {
      const id = newInvitationId();
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      timers.schedule(id, 500, callbackA);
      otherTimers.schedule(id, 500, callbackB);

      await sleep(1200);

      expect(callbackA.mock.calls.length + callbackB.mock.calls.length).toBe(1);
    } finally {
      await otherTimers.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });

  it("片側だけ登録しても両 instance のリスナーが受信し登録した側が必ず発火する", async () => {
    const otherListener = new RedisExpiredListener(REDIS_URL as string);
    await otherListener.onModuleInit();
    const otherTimers = new RedisHallwayInvitationTimers(REDIS_URL as string, otherListener);

    try {
      const id = newInvitationId();
      const callback = vi.fn();

      timers.schedule(id, 500, callback);

      await sleep(1200);

      expect(callback).toHaveBeenCalledTimes(1);
    } finally {
      await otherTimers.onModuleDestroy();
      await otherListener.onModuleDestroy();
    }
  });
});
