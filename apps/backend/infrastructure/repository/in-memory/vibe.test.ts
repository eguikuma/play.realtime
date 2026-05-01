import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryVibeRepository } from "./vibe";

describe("InMemoryVibeRepository", () => {
  it("保存した接続のステータスがスナップショットに集約されて現れる", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");

    const result = await repository.snapshot(roomId);
    expect(result).toEqual([{ memberId, status: "present" }]);
  });

  it("初回接続の保存では isFirst を返し 2 本目以降は返さない", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    const first = await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const second = await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");

    expect(first.isFirst).toBe(true);
    expect(second.isFirst).toBe(false);
  });

  it("同じメンバーが複数の接続を持つときスナップショットは集約後の単一ステータスを返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "focused");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "present");

    const result = await repository.snapshot(roomId);
    expect(result).toEqual([{ memberId, status: "present" }]);
  });

  it("既存接続の update は集約結果を書き換えて updated を返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const result = await repository.update(roomId, memberId, "conn-1" as ConnectionId, "focused");

    expect(result).toEqual({ updated: true, aggregated: "focused" });
    expect(await repository.get(roomId, memberId)).toBe("focused");
  });

  it("台帳に居ない接続への update は何もせず updated 偽を返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    const result = await repository.update(
      roomId,
      memberId,
      "conn-phantom" as ConnectionId,
      "present",
    );

    expect(result).toEqual({ updated: false, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除済み接続への update は復活させずに updated 偽を返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.delete(roomId, memberId, "conn-1" as ConnectionId);
    const result = await repository.update(roomId, memberId, "conn-1" as ConnectionId, "focused");

    expect(result).toEqual({ updated: false, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除は最後の接続で isLast を返し集約結果は null になる", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    const result = await repository.delete(roomId, memberId, "conn-1" as ConnectionId);

    expect(result).toEqual({ isLast: true, aggregated: null });
    expect(await repository.snapshot(roomId)).toEqual([]);
  });

  it("削除で接続が残っていれば isLast を返さず残りの集約結果を返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");
    const result = await repository.delete(roomId, memberId, "conn-1" as ConnectionId);

    expect(result).toEqual({ isLast: false, aggregated: "focused" });
  });

  it("取得はメンバーの全接続を集約して返し接続が無ければ null を返す", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-1234" as RoomId;
    const aliceId = "member-alice" as MemberId;
    const bobId = "member-bob" as MemberId;

    await repository.save(roomId, aliceId, "conn-1" as ConnectionId, "focused");
    await repository.save(roomId, aliceId, "conn-2" as ConnectionId, "present");

    expect(await repository.get(roomId, aliceId)).toBe("present");
    expect(await repository.get(roomId, bobId)).toBeNull();
  });

  it("別のルームの vibe は混ざらない", async () => {
    const repository = new InMemoryVibeRepository();
    const roomA = "room-abc-aaaa" as RoomId;
    const roomB = "room-abc-bbbb" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomA, memberId, "conn-1" as ConnectionId, "present");
    await repository.save(roomB, memberId, "conn-2" as ConnectionId, "focused");

    expect(await repository.snapshot(roomA)).toEqual([{ memberId, status: "present" }]);
    expect(await repository.snapshot(roomB)).toEqual([{ memberId, status: "focused" }]);
  });

  it("ルーム単位の取り除きで配下の全接続データが破棄される", async () => {
    const repository = new InMemoryVibeRepository();
    const roomId = "room-abc-aaaa" as RoomId;
    const keep = "room-abc-bbbb" as RoomId;
    const memberId = "member-alice" as MemberId;

    await repository.save(roomId, memberId, "conn-1" as ConnectionId, "present");
    await repository.save(roomId, memberId, "conn-2" as ConnectionId, "focused");
    await repository.save(keep, memberId, "conn-3" as ConnectionId, "present");

    await repository.remove(roomId);

    expect(await repository.snapshot(roomId)).toEqual([]);
    expect(await repository.get(roomId, memberId)).toBeNull();
    expect(await repository.snapshot(keep)).toEqual([{ memberId, status: "present" }]);
  });

  it("存在しないルームを取り除いても例外を投げない", async () => {
    const repository = new InMemoryVibeRepository();

    await expect(repository.remove("room-abc-zzzz" as RoomId)).resolves.toBeUndefined();
  });
});
