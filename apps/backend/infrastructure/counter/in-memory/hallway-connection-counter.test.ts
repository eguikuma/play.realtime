import type { MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryHallwayConnectionCounter } from "./hallway-connection-counter";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;

describe("InMemoryHallwayConnectionCounter", () => {
  it("初回の紐付けは isFirst を返す", async () => {
    const counter = new InMemoryHallwayConnectionCounter();

    expect(await counter.attach(roomId, memberId)).toEqual({ isFirst: true });
  });

  it("2 本目以降の紐付けは isFirst を返さない", async () => {
    const counter = new InMemoryHallwayConnectionCounter();

    await counter.attach(roomId, memberId);
    expect(await counter.attach(roomId, memberId)).toEqual({ isFirst: false });
  });

  it("1 本だけ接続中の解除は isLast を返す", async () => {
    const counter = new InMemoryHallwayConnectionCounter();

    await counter.attach(roomId, memberId);
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });

  it("複数接続のうち 1 本を解除しても isLast を返さず残りの本数を保持する", async () => {
    const counter = new InMemoryHallwayConnectionCounter();

    await counter.attach(roomId, memberId);
    await counter.attach(roomId, memberId);
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: false });
    expect(await counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });
});
