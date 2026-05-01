import type { MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { HallwayConnectionCounter } from "./connection-counter";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;

describe("HallwayConnectionCounter", () => {
  it("初回の紐付けは isFirst を返す", () => {
    const counter = new HallwayConnectionCounter();

    expect(counter.attach(roomId, memberId)).toEqual({ isFirst: true });
  });

  it("2 本目以降の紐付けは isFirst を返さない", () => {
    const counter = new HallwayConnectionCounter();

    counter.attach(roomId, memberId);
    expect(counter.attach(roomId, memberId)).toEqual({ isFirst: false });
  });

  it("1 本だけ接続中の解除は isLast を返す", () => {
    const counter = new HallwayConnectionCounter();

    counter.attach(roomId, memberId);
    expect(counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });

  it("複数接続のうち 1 本を解除しても isLast を返さず残りの本数を保持する", () => {
    const counter = new HallwayConnectionCounter();

    counter.attach(roomId, memberId);
    counter.attach(roomId, memberId);
    expect(counter.detach(roomId, memberId)).toEqual({ isLast: false });
    expect(counter.detach(roomId, memberId)).toEqual({ isLast: true });
  });
});
