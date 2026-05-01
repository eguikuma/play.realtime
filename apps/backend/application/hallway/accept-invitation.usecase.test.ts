import type { CallId, Invitation, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { AcceptHallwayInvitation } from "./accept-invitation.usecase";
import type { HallwayBroadcaster } from "./broadcaster";
import type { HallwayInvitationTimers } from "./invitation-timers";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "inviter" as MemberId;
const inviteeId = "invitee" as MemberId;
const invitationId = "invitation" as InvitationId;
const callId = "call" as CallId;
const now = new Date("2026-04-20T09:00:00.000Z");

const invitation: Invitation = {
  id: invitationId,
  roomId,
  fromMemberId: inviterId,
  toMemberId: inviteeId,
  expiresAt: new Date(now.getTime() + 10_000).toISOString(),
};

const buildHallway = (overrides: Partial<HallwayRepository> = {}): HallwayRepository => ({
  saveInvitation: vi.fn(),
  findInvitation: vi.fn(async () => invitation),
  findOutgoingInvitation: vi.fn(async () => null),
  findIncomingInvitation: vi.fn(async () => null),
  findAllInvitationsInRoom: vi.fn(async () => []),
  deleteInvitation: vi.fn(),
  saveCall: vi.fn(),
  findCall: vi.fn(async () => null),
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

const buildIds = (): NanoidIdGenerator =>
  ({ call: vi.fn(() => callId) }) as unknown as NanoidIdGenerator;

const buildTimers = (cancel = vi.fn()): HallwayInvitationTimers =>
  ({ cancel, schedule: vi.fn() }) as unknown as HallwayInvitationTimers;

describe("AcceptHallwayInvitation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("招待先が受諾すると InvitationEnded `accepted` → CallStarted の順でルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const broadcaster = buildBroadcaster();
    const cancel = vi.fn();
    const usecase = new AcceptHallwayInvitation(
      hallway,
      broadcaster,
      buildIds(),
      buildTimers(cancel),
    );

    const call = await usecase.execute({ roomId, memberId: inviteeId, invitationId });

    expect(cancel).toHaveBeenCalledWith(invitationId);
    expect(hallway.deleteInvitation).toHaveBeenCalledWith(invitationId);
    expect(call).toEqual({
      id: callId,
      roomId,
      memberIds: [inviterId, inviteeId],
      startedAt: now.toISOString(),
    });
    expect(hallway.saveCall).toHaveBeenCalledWith(call);

    expect(broadcaster.invitationEnded).toHaveBeenCalledWith(roomId, {
      invitationId,
      reason: "accepted",
    });
    expect(broadcaster.callStarted).toHaveBeenCalledWith(roomId, { call });
  });

  it("招待先ではないメンバーが受諾しようとすると InvitationNotFound を投げる", async () => {
    const usecase = new AcceptHallwayInvitation(
      buildHallway(),
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
    );

    await expect(
      usecase.execute({ roomId, memberId: "outsider" as MemberId, invitationId }),
    ).rejects.toBeInstanceOf(InvitationNotFound);
  });

  it("招待が存在しないときは InvitationNotFound を投げる", async () => {
    const hallway = buildHallway({ findInvitation: vi.fn(async () => null) });
    const usecase = new AcceptHallwayInvitation(
      hallway,
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
    );

    await expect(
      usecase.execute({ roomId, memberId: inviteeId, invitationId }),
    ).rejects.toBeInstanceOf(InvitationNotFound);
  });
});
