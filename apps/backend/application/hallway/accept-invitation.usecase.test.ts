import type { CallId, Invitation, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { AcceptHallwayInvitation } from "./accept-invitation.usecase";
import type { HallwayBroadcaster } from "./broadcaster";
import type { HallwayInvitationTimers } from "./invitation-timers";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "m1" as MemberId;
const inviteeId = "m2" as MemberId;
const invitationId = "inv-1" as InvitationId;
const callId = "call-1" as CallId;
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
  ...overrides,
});

const buildBroadcaster = (toRoom = vi.fn(), toMembers = vi.fn()): HallwayBroadcaster =>
  ({ toRoom, toMembers }) as unknown as HallwayBroadcaster;

const buildIds = (): NanoidIdGenerator =>
  ({ call: vi.fn(() => callId) }) as unknown as NanoidIdGenerator;

const buildTimers = (cancel = vi.fn()): HallwayInvitationTimers =>
  ({ cancel, register: vi.fn() }) as unknown as HallwayInvitationTimers;

describe("AcceptHallwayInvitation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invitee が受諾すると InvitationEnded accepted → CallStarted の順でルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const toRoom = vi.fn();
    const cancel = vi.fn();
    const usecase = new AcceptHallwayInvitation(
      hallway,
      buildBroadcaster(toRoom),
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

    expect(toRoom).toHaveBeenNthCalledWith(1, roomId, "InvitationEnded", {
      invitationId,
      reason: "accepted",
    });
    expect(toRoom).toHaveBeenNthCalledWith(2, roomId, "CallStarted", { call });
  });

  it("invitee 以外が受諾しようとすると InvitationNotFound を投げる", async () => {
    const usecase = new AcceptHallwayInvitation(
      buildHallway(),
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
    );

    await expect(
      usecase.execute({ roomId, memberId: "m3" as MemberId, invitationId }),
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
