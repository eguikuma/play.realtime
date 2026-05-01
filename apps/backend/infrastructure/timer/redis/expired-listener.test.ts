import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisExpiredListener } from "./expired-listener";

const REDIS_URL = process.env.REDIS_URL;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 実 Redis に接続して `RedisExpiredListener` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip して、ローカル Redis や CI services の起動状態に依存しないようにする
 * `--notify-keyspace-events Ex` が有効な前提、各テストは UUID ベースのキーを使ってキースペース通知を識別する
 */
describe.skipIf(!REDIS_URL)("RedisExpiredListener", () => {
  let listener: RedisExpiredListener;
  let writer: Redis;

  beforeEach(async () => {
    listener = new RedisExpiredListener(REDIS_URL as string);
    await listener.onModuleInit();
    writer = new Redis(REDIS_URL as string);
  });

  afterEach(async () => {
    await listener.onModuleDestroy();
    await writer.quit();
  });

  it("登録した prefix と一致する expired key を handler に渡す", async () => {
    const prefix = `test-listener-match:${randomUUID().replace(/-/g, "")}:`;
    const handler = vi.fn();
    listener.register(prefix, handler);

    const key = `${prefix}alpha`;
    await writer.set(key, "1", "PX", 200);
    await sleep(800);

    expect(handler).toHaveBeenCalledWith(key);
  });

  it("登録した prefix と一致しない expired key は handler に渡さない", async () => {
    const prefix = `test-listener-miss:${randomUUID().replace(/-/g, "")}:`;
    const handler = vi.fn();
    listener.register(prefix, handler);

    const otherKey = `unrelated:${randomUUID().replace(/-/g, "")}:beta`;
    await writer.set(otherKey, "1", "PX", 200);
    await sleep(800);

    expect(handler).not.toHaveBeenCalled();
  });

  it("複数 prefix を登録した場合は一致した側の handler のみ呼ぶ", async () => {
    const matched = `test-listener-multi-a:${randomUUID().replace(/-/g, "")}:`;
    const skipped = `test-listener-multi-b:${randomUUID().replace(/-/g, "")}:`;
    const matchedHandler = vi.fn();
    const skippedHandler = vi.fn();
    listener.register(matched, matchedHandler);
    listener.register(skipped, skippedHandler);

    const key = `${matched}gamma`;
    await writer.set(key, "1", "PX", 200);
    await sleep(800);

    expect(matchedHandler).toHaveBeenCalledWith(key);
    expect(skippedHandler).not.toHaveBeenCalled();
  });
});
