import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "../../application/shared/ports/pubsub";
import { InMemoryPubSub } from "./in-memory";

describe("InMemoryPubSub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("同じトピックを購読している購読者すべてにメッセージが届く", async () => {
    const pubsub = new InMemoryPubSub();
    const alice = vi.fn();
    const bob = vi.fn();
    pubsub.subscribe<{ text: string }>("murmur", alice);
    pubsub.subscribe<{ text: string }>("murmur", bob);

    await pubsub.publish("murmur", { text: "hello" });

    expect(alice).toHaveBeenCalledWith({ text: "hello" });
    expect(bob).toHaveBeenCalledWith({ text: "hello" });
  });

  it("別のトピックの購読者には配信しない", async () => {
    const pubsub = new InMemoryPubSub();
    const listener = vi.fn();
    const bystander = vi.fn();
    pubsub.subscribe("murmur", listener);
    pubsub.subscribe("vibe", bystander);

    await pubsub.publish("murmur", 1);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(bystander).not.toHaveBeenCalled();
  });

  it("購読を解除した後はメッセージが届かない", async () => {
    const pubsub = new InMemoryPubSub();
    const listener = vi.fn();
    const subscription = pubsub.subscribe("murmur", listener);

    subscription.unsubscribe();
    await pubsub.publish("murmur", 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it("購読者の処理でエラーが起きても他の購読者への配信は続く", async () => {
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    const pubsub = new InMemoryPubSub();
    const failing = vi.fn(() => {
      throw new Error("boom");
    });
    const healthy = vi.fn();
    pubsub.subscribe("murmur", failing);
    pubsub.subscribe("murmur", healthy);

    await pubsub.publish("murmur", 1);

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledWith(1);
  });

  it("配信中に自分を解除しても、その配信は届く", async () => {
    const pubsub = new InMemoryPubSub();
    const later = vi.fn();
    let laterSubscription: Subscription | undefined;
    pubsub.subscribe("murmur", () => {
      laterSubscription?.unsubscribe();
    });
    laterSubscription = pubsub.subscribe("murmur", later);

    await pubsub.publish("murmur", 1);

    expect(later).toHaveBeenCalledWith(1);
  });

  it("配信中に新規購読した購読者は、次の配信から受け取る", async () => {
    const pubsub = new InMemoryPubSub();
    const late = vi.fn();
    pubsub.subscribe("murmur", () => {
      pubsub.subscribe("murmur", late);
    });

    await pubsub.publish("murmur", 1);
    expect(late).not.toHaveBeenCalled();

    await pubsub.publish("murmur", 2);

    expect(late).toHaveBeenCalledWith(2);
  });

  it("全員が解除された後に再び購読した購読者にも配信する", async () => {
    const pubsub = new InMemoryPubSub();
    const first = pubsub.subscribe("murmur", vi.fn());
    first.unsubscribe();

    const second = vi.fn();
    pubsub.subscribe("murmur", second);
    await pubsub.publish("murmur", 42);

    expect(second).toHaveBeenCalledWith(42);
  });

  it("同じ購読解除を二度呼んでもエラーにならない", () => {
    const pubsub = new InMemoryPubSub();
    const subscription = pubsub.subscribe("murmur", vi.fn());

    subscription.unsubscribe();

    expect(() => subscription.unsubscribe()).not.toThrow();
  });

  it("プレフィックス一括クローズで一致するトピックの購読者に配信が届かなくなる", async () => {
    const pubsub = new InMemoryPubSub();
    const vibe = vi.fn();
    const bgm = vi.fn();
    const otherRoom = vi.fn();
    pubsub.subscribe("room:abc:vibe", vibe);
    pubsub.subscribe("room:abc:bgm", bgm);
    pubsub.subscribe("room:zzz:vibe", otherRoom);

    pubsub.closeByPrefix("room:abc:");
    await pubsub.publish("room:abc:vibe", 1);
    await pubsub.publish("room:abc:bgm", 1);
    await pubsub.publish("room:zzz:vibe", 2);

    expect(vibe).not.toHaveBeenCalled();
    expect(bgm).not.toHaveBeenCalled();
    expect(otherRoom).toHaveBeenCalledWith(2);
  });

  it("プレフィックスに一致するトピックが無ければ何もせず例外を投げない", () => {
    const pubsub = new InMemoryPubSub();

    expect(() => pubsub.closeByPrefix("room:none:")).not.toThrow();
  });
});
