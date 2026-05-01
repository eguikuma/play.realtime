import { randomUUID } from "node:crypto";
import type { BgmState, MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RedisBgmRepository } from "./bgm";

const REDIS_URL = process.env.REDIS_URL;

const buildState = (): BgmState => ({
  current: {
    trackId: "Blues" as TrackId,
    setBy: "member-alice" as MemberId,
    setAt: "2026-04-22T10:00:00.000Z",
  },
  undoable: null,
});

/**
 * 実 Redis に接続して `RedisBgmRepository` の挙動を検証する
 * `REDIS_URL` 未設定なら丸ごと skip して、ローカル Redis や CI services の起動状態に依存しないようにする
 */
describe.skipIf(!REDIS_URL)("RedisBgmRepository", () => {
  let repository: RedisBgmRepository;

  beforeEach(() => {
    const keyPrefix = `test:${randomUUID().replace(/-/g, "")}:`;
    repository = new RedisBgmRepository(REDIS_URL as string, { keyPrefix });
  });

  afterEach(async () => {
    await repository.onModuleDestroy();
  });

  it("保存した `state` がそのまま取り出せる", async () => {
    const roomId = "room-redis-bgm-1" as RoomId;
    const state = buildState();

    await repository.save(roomId, state);

    expect(await repository.get(roomId)).toEqual(state);
  });

  it("保存データが無いルームの取り出しは `null` を返す", async () => {
    expect(await repository.get("room-redis-bgm-empty" as RoomId)).toBeNull();
  });

  it("保存処理は同じルームの `state` を最新値で上書きする", async () => {
    const roomId = "room-redis-bgm-2" as RoomId;
    const second: BgmState = { current: null, undoable: null };

    await repository.save(roomId, buildState());
    await repository.save(roomId, second);

    expect(await repository.get(roomId)).toEqual(second);
  });

  it("別のルームの `state` は混ざらない", async () => {
    const roomA = "room-redis-bgm-a" as RoomId;
    const roomB = "room-redis-bgm-b" as RoomId;
    const stateA = buildState();
    const stateB: BgmState = { current: null, undoable: null };

    await repository.save(roomA, stateA);
    await repository.save(roomB, stateB);

    expect(await repository.get(roomA)).toEqual(stateA);
    expect(await repository.get(roomB)).toEqual(stateB);
  });

  it("ルーム単位の取り除きで `state` が `null` に戻る", async () => {
    const roomId = "room-redis-bgm-3" as RoomId;

    await repository.save(roomId, buildState());
    await repository.remove(roomId);

    expect(await repository.get(roomId)).toBeNull();
  });
});
