import type { BgmState, MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryBgmRepository } from "./bgm";

const buildState = (): BgmState => ({
  current: {
    trackId: "Blues" as TrackId,
    setBy: "member-alice" as MemberId,
    setAt: "2026-04-22T10:00:00.000Z",
  },
  undoable: null,
});

describe("InMemoryBgmRepository", () => {
  it("保存した `state` がそのまま取り出せる", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;
    const state = buildState();

    await repository.save(roomId, state);

    expect(await repository.get(roomId)).toEqual(state);
  });

  it("保存データが無いルームの取り出しは `null` を返す", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;

    expect(await repository.get(roomId)).toBeNull();
  });

  it("保存処理は同じルームの `state` を最新値で上書きする", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;
    const first = buildState();
    const second: BgmState = { current: null, undoable: null };

    await repository.save(roomId, first);
    await repository.save(roomId, second);

    expect(await repository.get(roomId)).toEqual(second);
  });

  it("別のルームの `state` は混ざらない", async () => {
    const repository = new InMemoryBgmRepository();
    const roomA = "room-abc-aaaa" as RoomId;
    const roomB = "room-abc-bbbb" as RoomId;
    const stateA = buildState();
    const stateB: BgmState = { current: null, undoable: null };

    await repository.save(roomA, stateA);
    await repository.save(roomB, stateB);

    expect(await repository.get(roomA)).toEqual(stateA);
    expect(await repository.get(roomB)).toEqual(stateB);
  });

  it("ルーム単位の取り除きで `state` が `null` に戻る", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-aaaa" as RoomId;
    const keep = "room-abc-bbbb" as RoomId;

    await repository.save(roomId, buildState());
    await repository.save(keep, buildState());

    await repository.remove(roomId);

    expect(await repository.get(roomId)).toBeNull();
    expect(await repository.get(keep)).not.toBeNull();
  });

  it("存在しないルームを取り除いても例外を投げない", async () => {
    const repository = new InMemoryBgmRepository();

    await expect(repository.remove("room-abc-zzzz" as RoomId)).resolves.toBeUndefined();
  });
});
