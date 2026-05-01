import type { Invitation, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import { type HallwayRepository, InvitationNotFound } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { CancelHallwayInvitation } from "./cancel-invitation.usecase";
import type { HallwayInvitationTimers } from "./invitation-timers";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "inviter" as MemberId;
const inviteeId = "invitee" as MemberId;
const invitationId = "invitation" as InvitationId;

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

const buildTimers = (cancel = vi.fn()): HallwayInvitationTimers =>
  ({ cancel, register: vi.fn() }) as unknown as HallwayInvitationTimers;

describe("CancelHallwayInvitation", () => {
  it("招待元が取り消すと招待を削除し InvitationEnded `cancelled` をルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const broadcaster = buildBroadcaster();
    const cancel = vi.fn();
    const usecase = new CancelHallwayInvitation(hallway, broadcaster, buildTimers(cancel));

    await usecase.execute({ roomId, memberId: inviterId, invitationId });

    expect(cancel).toHaveBeenCalledWith(invitationId);
    expect(hallway.deleteInvitation).toHaveBeenCalledWith(invitationId);
    expect(broadcaster.invitationEnded).toHaveBeenCalledWith(roomId, {
      invitationId,
      reason: "cancelled",
    });
  });

  it("招待元ではないメンバーが取り消そうとすると InvitationNotFound を投げる", async () => {
    const usecase = new CancelHallwayInvitation(buildHallway(), buildBroadcaster(), buildTimers());

    await expect(
      usecase.execute({ roomId, memberId: inviteeId, invitationId }),
    ).rejects.toBeInstanceOf(InvitationNotFound);
  });
});
