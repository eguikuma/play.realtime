import { Member, type Room, RoomId } from "@play.realtime/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PubSub, Subscription } from "../../../application/shared/ports/pubsub";
import { GlobalTopic } from "../../../application/shared/topic";
import type { RoomRepository } from "../../../domain/room";
import { create } from "../../../domain/room";
import { CachingRoomRepository } from "./room";

const roomId = RoomId.parse("room-cache-1234");
const createdAt = "2026-04-29T00:00:00.000Z";
const host = Member.parse({ id: "host-1", name: "alice", joinedAt: createdAt });
const room: Room = create({ id: roomId, host, createdAt });

type SubscribeHandler = (payload: { roomId: RoomId }) => void;

type StubPubSub = PubSub & {
  emit: (handler: SubscribeHandler) => SubscribeHandler;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const buildPubSub = (): StubPubSub => {
  const unsubscribe = vi.fn();
  const subscription: Subscription = { unsubscribe };
  let captured: SubscribeHandler | null = null;

  return {
    publish: vi.fn(async () => undefined),
    subscribe: vi.fn((_topic, handler) => {
      captured = handler as SubscribeHandler;
      return subscription;
    }),
    closeByPrefix: vi.fn(),
    emit: () => {
      if (!captured) {
        throw new Error("subscribe が呼ばれる前に emit した");
      }
      return captured;
    },
    unsubscribe,
  };
};

const buildInner = (): RoomRepository => ({
  save: vi.fn(async () => undefined),
  find: vi.fn(async () => room),
  remove: vi.fn(async () => undefined),
});

describe("CachingRoomRepository", () => {
  let inner: RoomRepository;
  let pubsub: StubPubSub;
  let repository: CachingRoomRepository;

  beforeEach(() => {
    inner = buildInner();
    pubsub = buildPubSub();
    repository = new CachingRoomRepository(inner, pubsub);
    repository.onModuleInit();
  });

  it("`find` は最初の呼び出しで inner.find を 1 回だけ叩く", async () => {
    await repository.find(roomId);

    expect(inner.find).toHaveBeenCalledTimes(1);
  });

  it("`find` は 2 回目以降は cache から返し inner.find を呼ばない", async () => {
    await repository.find(roomId);
    await repository.find(roomId);
    await repository.find(roomId);

    expect(inner.find).toHaveBeenCalledTimes(1);
  });

  it("`find` が `null` を返したときは cache に載せない", async () => {
    inner.find = vi.fn(async () => null);
    repository = new CachingRoomRepository(inner, pubsub);

    await repository.find(roomId);
    await repository.find(roomId);

    expect(inner.find).toHaveBeenCalledTimes(2);
  });

  it("`save` は inner.save を呼んでから cache を削除する", async () => {
    await repository.find(roomId);
    expect(inner.find).toHaveBeenCalledTimes(1);

    await repository.save(room);
    await repository.find(roomId);

    expect(inner.save).toHaveBeenCalledWith(room);
    expect(inner.find).toHaveBeenCalledTimes(2);
  });

  it("`save` 後の `find` は inner.find を再度叩く", async () => {
    await repository.find(roomId);
    await repository.save(room);
    await repository.find(roomId);

    expect(inner.find).toHaveBeenCalledTimes(2);
  });

  it("`save` 後に `GlobalTopic.RoomCacheInvalidate` を配信する", async () => {
    await repository.save(room);

    expect(pubsub.publish).toHaveBeenCalledWith(GlobalTopic.RoomCacheInvalidate, { roomId });
  });

  it("`save` の publish が失敗しても inner.save の結果は成功扱いになる", async () => {
    pubsub.publish = vi.fn(async () => {
      throw new Error("publish ダウン");
    });

    await expect(repository.save(room)).resolves.toBeUndefined();
    expect(inner.save).toHaveBeenCalledTimes(1);
  });

  it("`remove` は inner.remove を呼んでから cache を削除して配信する", async () => {
    await repository.find(roomId);
    await repository.remove(roomId);
    await repository.find(roomId);

    expect(inner.remove).toHaveBeenCalledWith(roomId);
    expect(inner.find).toHaveBeenCalledTimes(2);
    expect(pubsub.publish).toHaveBeenCalledWith(GlobalTopic.RoomCacheInvalidate, { roomId });
  });

  it("subscribe handler は cache を削除する", async () => {
    await repository.find(roomId);
    expect(inner.find).toHaveBeenCalledTimes(1);

    const handler = pubsub.emit(() => undefined);
    handler({ roomId });
    await repository.find(roomId);

    expect(inner.find).toHaveBeenCalledTimes(2);
  });

  it("`onModuleDestroy` で subscription を解除する", async () => {
    await repository.onModuleDestroy();

    expect(pubsub.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("`onModuleDestroy` で inner の `onModuleDestroy` も連鎖して呼ぶ", async () => {
    const innerDestroy = vi.fn(async () => undefined);
    const innerWithDestroy = { ...inner, onModuleDestroy: innerDestroy };
    repository = new CachingRoomRepository(innerWithDestroy as RoomRepository, pubsub);
    repository.onModuleInit();

    await repository.onModuleDestroy();

    expect(innerDestroy).toHaveBeenCalledTimes(1);
  });
});
