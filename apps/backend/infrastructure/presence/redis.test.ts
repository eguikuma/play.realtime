import { randomUUID } from "node:crypto";
import type { RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisPubSub } from "../pubsub/redis";
import { RedisRoomPresence } from "./redis";

const REDIS_URL = process.env.REDIS_URL;

/**
 * 実 Redis に接続して `RedisRoomPresence` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip し、`INCR` `DECR` の戻り値判定と pub/sub 経由の遷移配信が成立することを確認する
 * 接続数 counter は in-memory のテストと同じ意味論を満たし、`populated` `empty` の遷移は単一プロセス内の購読者へも届く
 */
describe.skipIf(!REDIS_URL)("RedisRoomPresence", () => {
  let pubsub: RedisPubSub;
  let presence: RedisRoomPresence;
  let room: RoomId;

  /**
   * `register` `deregister` は fire-and-forget で `INCR`/`DECR` を投げるため、検証前に Redis 往復ぶんだけ待つ必要がある
   * `presence:transition` の pub/sub 配信も Redis 経由で完了に時間が要るので、固定の短い待ち時間で吸収する
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 80));

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    pubsub = new RedisPubSub(REDIS_URL as string);
    presence = new RedisRoomPresence(REDIS_URL as string, pubsub, { keyPrefix });
    room = `room-redis-presence-${randomUUID().slice(0, 8)}` as RoomId;
  });

  afterEach(async () => {
    await presence.onModuleDestroy();
    await pubsub.onModuleDestroy();
  });

  it("空から初回の接続で `populated` を配信する", async () => {
    const listener = vi.fn();
    presence.onTransition(listener);
    await settle();

    presence.register(room);
    await settle();

    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
  });

  it("同じルームの 2 本目の接続では `populated` を配信しない", async () => {
    presence.register(room);
    await settle();
    const listener = vi.fn();
    presence.onTransition(listener);
    await settle();

    presence.register(room);
    await settle();

    expect(listener).not.toHaveBeenCalled();
  });

  it("最終接続の切断で `empty` を配信する", async () => {
    presence.register(room);
    presence.register(room);
    await settle();
    const listener = vi.fn();
    presence.onTransition(listener);
    await settle();

    presence.deregister(room);
    await settle();
    expect(listener).not.toHaveBeenCalled();

    presence.deregister(room);
    await settle();
    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "empty" });
  });

  it("`countConnections` は現在の総接続数を返す", async () => {
    presence.register(room);
    presence.register(room);
    presence.register(room);
    presence.deregister(room);
    await settle();

    expect(await presence.countConnections(room)).toBe(2);
  });

  it("空になった後に再び登録すると `populated` を再配信する", async () => {
    presence.register(room);
    await settle();
    presence.deregister(room);
    await settle();
    const listener = vi.fn();
    presence.onTransition(listener);
    await settle();

    presence.register(room);
    await settle();

    expect(listener).toHaveBeenCalledWith({ roomId: room, kind: "populated" });
  });

  it("購読を解除した後はイベントが届かない", async () => {
    const listener = vi.fn();
    const subscription = presence.onTransition(listener);
    await settle();

    subscription.unsubscribe();
    presence.register(room);
    await settle();

    expect(listener).not.toHaveBeenCalled();
  });
});
