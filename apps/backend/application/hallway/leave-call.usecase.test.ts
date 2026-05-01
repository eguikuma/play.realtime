import type { Call, CallId, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { CallNotFound, type HallwayRepository, NotCallParticipant } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { LeaveHallwayCall } from "./leave-call.usecase";

const roomId = "room-abc-1234" as RoomId;
const callId = "call-1" as CallId;
const inviter = "m1" as MemberId;
const invitee = "m2" as MemberId;

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

const buildBroadcaster = (
  overrides: Partial<Record<keyof HallwayBroadcaster, ReturnType<typeof vi.fn>>> = {},
): HallwayBroadcaster =>
  ({
    invited: vi.fn(),
    invitationEnded: vi.fn(),
    callStarted: vi.fn(),
    callEnded: vi.fn(),
    message: vi.fn(),
    ...overrides,
  }) as unknown as HallwayBroadcaster;

describe("LeaveHallwayCall", () => {
  it("参加者が明示的に退出すると通話を削除し CallEnded explicit をルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const broadcaster = buildBroadcaster();
    const usecase = new LeaveHallwayCall(hallway, broadcaster);

    await usecase.execute({ roomId, callId, memberId: inviter });

    expect(hallway.deleteCall).toHaveBeenCalledWith(callId);
    expect(broadcaster.callEnded).toHaveBeenCalledWith(roomId, {
      callId,
      reason: "explicit",
    });
  });

  it("通話が存在しないときは CallNotFound を投げる", async () => {
    const hallway = buildHallway({ findCall: vi.fn(async () => null) });
    const usecase = new LeaveHallwayCall(hallway, buildBroadcaster());

    await expect(usecase.execute({ roomId, callId, memberId: inviter })).rejects.toBeInstanceOf(
      CallNotFound,
    );
  });

  it("参加者でないメンバーが退出しようとすると NotCallParticipant を投げる", async () => {
    const usecase = new LeaveHallwayCall(buildHallway(), buildBroadcaster());

    await expect(
      usecase.execute({ roomId, callId, memberId: "m3" as MemberId }),
    ).rejects.toBeInstanceOf(NotCallParticipant);
  });
});
