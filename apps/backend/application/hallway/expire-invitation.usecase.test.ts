import type { Invitation, InvitationId, MemberId, RoomId } from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { HallwayRepository } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { ExpireHallwayInvitation } from "./expire-invitation.usecase";

const roomId = "room-abc-1234" as RoomId;
const invitationId = "invitation" as InvitationId;

const invitation: Invitation = {
  id: invitationId,
  roomId,
  fromMemberId: "inviter" as MemberId,
  toMemberId: "invitee" as MemberId,
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

describe("ExpireHallwayInvitation", () => {
  it("招待を削除し InvitationEnded `expired` をルーム全員に配信する", async () => {
    const hallway = buildHallway();
    const broadcaster = buildBroadcaster();
    const usecase = new ExpireHallwayInvitation(hallway, broadcaster);

    await usecase.execute({ roomId, invitationId });

    expect(hallway.deleteInvitation).toHaveBeenCalledWith(invitationId);
    expect(broadcaster.invitationEnded).toHaveBeenCalledWith(roomId, {
      invitationId,
      reason: "expired",
    });
  });

  it("招待が既に存在しないときは何もせず配信しない", async () => {
    const hallway = buildHallway({ findInvitation: vi.fn(async () => null) });
    const broadcaster = buildBroadcaster();
    const usecase = new ExpireHallwayInvitation(hallway, broadcaster);

    await usecase.execute({ roomId, invitationId });

    expect(broadcaster.invitationEnded).not.toHaveBeenCalled();
  });
});
