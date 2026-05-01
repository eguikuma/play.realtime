import type { Invitation, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { type HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { DeclineHallwayInvitation } from "./decline-invitation.usecase";
import type { HallwayInvitationTimers } from "./invitation-timers";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "m1" as MemberId;
const inviteeId = "m2" as MemberId;
const invitationId = "inv-1" as InvitationId;

const invitation: Invitation = {
  id: invitationId,
  roomId,
  fromMemberId: inviterId,
  toMemberId: inviteeId,
  expiresAt: "2026-04-20T09:00:10.000Z",
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

const buildTimers = (cancel = vi.fn()): HallwayInvitationTimers =>
  ({ cancel, register: vi.fn() }) as unknown as HallwayInvitationTimers;

describe("DeclineHallwayInvitation", () => {
  it("invitee が拒否すると招待を削除し InvitationEnded declined をルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const toRoom = vi.fn();
    const cancel = vi.fn();
    const usecase = new DeclineHallwayInvitation(
      hallway,
      buildBroadcaster(toRoom),
      buildTimers(cancel),
    );

    await usecase.execute({ roomId, memberId: inviteeId, invitationId });

    expect(cancel).toHaveBeenCalledWith(invitationId);
    expect(hallway.deleteInvitation).toHaveBeenCalledWith(invitationId);
    expect(toRoom).toHaveBeenCalledWith(roomId, "InvitationEnded", {
      invitationId,
      reason: "declined",
    });
  });

  it("invitee 以外が拒否しようとすると InvitationNotFound を投げる", async () => {
    const usecase = new DeclineHallwayInvitation(buildHallway(), buildBroadcaster(), buildTimers());

    await expect(
      usecase.execute({ roomId, memberId: inviterId, invitationId }),
    ).rejects.toBeInstanceOf(InvitationNotFound);
  });
});
