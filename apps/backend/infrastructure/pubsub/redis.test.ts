import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisPubSub } from "./redis";

const REDIS_URL = process.env.REDIS_URL;

/**
 * 実 Redis に接続して `RedisPubSub` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip して、ローカル Redis や CI services の起動状態に依存しないようにする
 * 各 test ケースは UUID ベースの prefix を発行してトピック空間を分離し、並列実行時の干渉を避ける
 */
describe.skipIf(!REDIS_URL)("RedisPubSub", () => {
  let pubsub: RedisPubSub;
  let prefix: string;

  /**
   * Redis pub/sub の `SUBSCRIBE` はコマンド送出から確立までネットワーク往復を挟むため、subscribe 直後の publish は届かないことがある
   * 確立完了を待つ確実な方法が port 越しには無いので、整数値の固定待ちで実用的な許容にする
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 80));

  beforeEach(() => {
    pubsub = new RedisPubSub(REDIS_URL as string);
    prefix = `test:${randomUUID().replace(/-/g, "")}:`;
  });

  afterEach(async () => {
    await pubsub.onModuleDestroy();
  });

  it("購読者にメッセージが届く", async () => {
    const listener = vi.fn();
    pubsub.subscribe<{ text: string }>(`${prefix}murmur`, listener);
    await settle();

    await pubsub.publish(`${prefix}murmur`, { text: "hello" });
    await settle();

    expect(listener).toHaveBeenCalledWith({ text: "hello" });
  });

  it("同じトピックの購読者すべてに配信する", async () => {
    const alice = vi.fn();
    const bob = vi.fn();
    pubsub.subscribe(`${prefix}murmur`, alice);
    pubsub.subscribe(`${prefix}murmur`, bob);
    await settle();

    await pubsub.publish(`${prefix}murmur`, 1);
    await settle();

    expect(alice).toHaveBeenCalledWith(1);
    expect(bob).toHaveBeenCalledWith(1);
  });

  it("別のトピックの購読者には配信しない", async () => {
    const listener = vi.fn();
    const bystander = vi.fn();
    pubsub.subscribe(`${prefix}murmur`, listener);
    pubsub.subscribe(`${prefix}vibe`, bystander);
    await settle();

    await pubsub.publish(`${prefix}murmur`, 1);
    await settle();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(bystander).not.toHaveBeenCalled();
  });

  it("購読を解除した後はメッセージが届かない", async () => {
    const listener = vi.fn();
    const subscription = pubsub.subscribe(`${prefix}murmur`, listener);
    await settle();

    subscription.unsubscribe();
    await settle();

    await pubsub.publish(`${prefix}murmur`, 1);
    await settle();

    expect(listener).not.toHaveBeenCalled();
  });

  it("プレフィックス一括クローズで一致するトピックの購読者に配信が届かなくなる", async () => {
    const vibe = vi.fn();
    const bgm = vi.fn();
    const otherRoom = vi.fn();
    pubsub.subscribe(`${prefix}room:abc:vibe`, vibe);
    pubsub.subscribe(`${prefix}room:abc:bgm`, bgm);
    pubsub.subscribe(`${prefix}room:zzz:vibe`, otherRoom);
    await settle();

    pubsub.closeByPrefix(`${prefix}room:abc:`);
    await settle();

    await pubsub.publish(`${prefix}room:abc:vibe`, 1);
    await pubsub.publish(`${prefix}room:abc:bgm`, 1);
    await pubsub.publish(`${prefix}room:zzz:vibe`, 2);
    await settle();

    expect(vibe).not.toHaveBeenCalled();
    expect(bgm).not.toHaveBeenCalled();
    expect(otherRoom).toHaveBeenCalledWith(2);
  });

  it("オブジェクト型 payload も JSON 経由で型を保ったまま受け取れる", async () => {
    const listener = vi.fn();
    pubsub.subscribe<{ id: number; meta: { ok: boolean } }>(`${prefix}structured`, listener);
    await settle();

    await pubsub.publish(`${prefix}structured`, { id: 7, meta: { ok: true } });
    await settle();

    expect(listener).toHaveBeenCalledWith({ id: 7, meta: { ok: true } });
  });
});
