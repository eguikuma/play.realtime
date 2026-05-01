import { type MemberId, Murmur, type MurmurId, type RoomId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { post } from "./entity";

describe("post", () => {
  it("投稿内容をもとに一言を組み立てる", () => {
    const result = post({
      id: "murmur-1" as MurmurId,
      roomId: "room-abc-1234" as RoomId,
      memberId: "member-alice" as MemberId,
      text: "今日もがんばった",
      postedAt: "2026-04-18T12:00:00.000Z",
    });

    expect(Murmur.safeParse(result).success).toBe(true);
    expect(result.text).toBe("今日もがんばった");
  });
});
