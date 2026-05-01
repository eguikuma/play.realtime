import type { MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { PubSub } from "../ports/pubsub";
import { GlobalTopic } from "../topic";
import { LeaveRoom } from "./leave.usecase";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-1" as MemberId;

const buildPubSub = (): PubSub => ({
  publish: vi.fn(async () => undefined),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  closeByPrefix: vi.fn(),
});

describe("LeaveRoom", () => {
  it("GlobalTopic.MemberLeft へ roomId と memberId を含むペイロードを配信する", async () => {
    const pubsub = buildPubSub();
    const usecase = new LeaveRoom(pubsub);

    await usecase.execute({ roomId, memberId });

    expect(pubsub.publish).toHaveBeenCalledWith(GlobalTopic.MemberLeft, { roomId, memberId });
  });
});
