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
  it("保存した state が そのまま get で取り出せる", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;
    const state = buildState();

    await repository.save(roomId, state);

    expect(await repository.get(roomId)).toEqual(state);
  });

  it("entry が無い room の get は null を返す", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;

    expect(await repository.get(roomId)).toBeNull();
  });

  it("save は同じ room の state を最新値で上書きする", async () => {
    const repository = new InMemoryBgmRepository();
    const roomId = "room-abc-1234" as RoomId;
    const first = buildState();
    const second: BgmState = { current: null, undoable: null };

    await repository.save(roomId, first);
    await repository.save(roomId, second);

    expect(await repository.get(roomId)).toEqual(second);
  });

  it("別の room の state は混ざらない", async () => {
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
});
