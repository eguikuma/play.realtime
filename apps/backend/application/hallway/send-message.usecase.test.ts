import type { Call, CallId, MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CallNotFound, type HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { SendHallwayMessage } from "./send-message.usecase";

const roomId = "room-abc-1234" as RoomId;
const callId = "call-1" as CallId;
const inviter = "m1" as MemberId;
const invitee = "m2" as MemberId;
const now = new Date("2026-04-20T09:01:00.000Z");

const call: Call = {
  id: callId,
  roomId,
  memberIds: [inviter, invitee],
  startedAt: "2026-04-20T09:00:30.000Z",
};

const buildHallway = (overrides: Partial<HallwayRepository> = {}): HallwayRepository => ({
  saveInvitation: vi.fn(),
  findInvitation: vi.fn(async () => null),
  findOutgoingInvitation: vi.fn(async () => null),
  findIncomingInvitation: vi.fn(async () => null),
  findAllInvitationsInRoom: vi.fn(async () => []),
  deleteInvitation: vi.fn(),
  saveCall: vi.fn(),
  findCall: vi.fn(async () => call),
  findCallForMember: vi.fn(async () => null),
  findAllCallsInRoom: vi.fn(async () => []),
  deleteCall: vi.fn(),
  remove: vi.fn(),
  ...overrides,
});

const buildBroadcaster = (toRoom = vi.fn(), toMembers = vi.fn()): HallwayBroadcaster =>
  ({ toRoom, toMembers }) as unknown as HallwayBroadcaster;

describe("SendHallwayMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("通話参加者からの送信は Message として参加者 2 人にのみ配信する", async () => {
    const toMembers = vi.fn();
    const usecase = new SendHallwayMessage(buildHallway(), buildBroadcaster(vi.fn(), toMembers));

    await usecase.execute({ roomId, callId, memberId: inviter, text: "hi" });

    expect(toMembers).toHaveBeenCalledWith(roomId, [inviter, invitee], "Message", {
      message: {
        callId,
        fromMemberId: inviter,
        text: "hi",
        sentAt: now.toISOString(),
      },
    });
  });

  it("通話が存在しないときは CallNotFound を投げる", async () => {
    const hallway = buildHallway({ findCall: vi.fn(async () => null) });
    const usecase = new SendHallwayMessage(hallway, buildBroadcaster());

    await expect(
      usecase.execute({ roomId, callId, memberId: inviter, text: "hi" }),
    ).rejects.toBeInstanceOf(CallNotFound);
  });

  it("参加者でないメンバーが送信すると NotCallParticipant を投げる", async () => {
    const usecase = new SendHallwayMessage(buildHallway(), buildBroadcaster());

    await expect(
      usecase.execute({ roomId, callId, memberId: "m3" as MemberId, text: "hi" }),
    ).rejects.toBeInstanceOf(NotCallParticipant);
  });
});
