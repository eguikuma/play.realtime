import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { HallwayRepository } from "../../domain/hallway";
import type { HallwayBroadcaster } from "./broadcaster";
import { CleanupHallwayOnDisconnect } from "./cleanup-on-disconnect.usecase";
import type { HallwayInvitationTimers } from "./invitation-timers";

const roomId = "room-abc-1234" as RoomId;
const self = "m1" as MemberId;
const peer = "m2" as MemberId;

const buildHallway = (overrides: Partial<HallwayRepository> = {}): HallwayRepository => ({
  saveInvitation: vi.fn(),
  findInvitation: vi.fn(async () => null),
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

describe("CleanupHallwayOnDisconnect", () => {
  it("送信中の招待があれば InvitationEnded cancelled をルーム全員に配信する", async () => {
    const outgoing: Invitation = {
      id: "out-1" as InvitationId,
      roomId,
      fromMemberId: self,
      toMemberId: peer,
      expiresAt: "2026-04-20T09:00:10.000Z",
    };
    const hallway = buildHallway({ findOutgoingInvitation: vi.fn(async () => outgoing) });
    const broadcaster = buildBroadcaster();
    const cancel = vi.fn();
    const usecase = new CleanupHallwayOnDisconnect(hallway, broadcaster, buildTimers(cancel));

    await usecase.execute({ roomId, memberId: self });

    expect(cancel).toHaveBeenCalledWith(outgoing.id);
    expect(hallway.deleteInvitation).toHaveBeenCalledWith(outgoing.id);
    expect(broadcaster.invitationEnded).toHaveBeenCalledWith(roomId, {
      invitationId: outgoing.id,
      reason: "cancelled",
    });
  });

  it("受信中の招待があれば InvitationEnded declined をルーム全員に配信する", async () => {
    const incoming: Invitation = {
      id: "in-1" as InvitationId,
      roomId,
      fromMemberId: peer,
      toMemberId: self,
      expiresAt: "2026-04-20T09:00:10.000Z",
    };
    const hallway = buildHallway({ findIncomingInvitation: vi.fn(async () => incoming) });
    const broadcaster = buildBroadcaster();
    const usecase = new CleanupHallwayOnDisconnect(hallway, broadcaster, buildTimers());

    await usecase.execute({ roomId, memberId: self });

    expect(broadcaster.invitationEnded).toHaveBeenCalledWith(roomId, {
      invitationId: incoming.id,
      reason: "declined",
    });
  });

  it("進行中の通話があれば CallEnded disconnect をルーム全員に配信する", async () => {
    const call: Call = {
      id: "call-1" as CallId,
      roomId,
      memberIds: [self, peer],
      startedAt: "2026-04-20T09:00:30.000Z",
    };
    const hallway = buildHallway({ findCallForMember: vi.fn(async () => call) });
    const broadcaster = buildBroadcaster();
    const usecase = new CleanupHallwayOnDisconnect(hallway, broadcaster, buildTimers());

    await usecase.execute({ roomId, memberId: self });

    expect(hallway.deleteCall).toHaveBeenCalledWith(call.id);
    expect(broadcaster.callEnded).toHaveBeenCalledWith(roomId, {
      callId: call.id,
      reason: "disconnect",
    });
  });

  it("招待も通話も無いメンバーの切断では何もせず配信しない", async () => {
    const broadcaster = buildBroadcaster();
    const usecase = new CleanupHallwayOnDisconnect(buildHallway(), broadcaster, buildTimers());

    await usecase.execute({ roomId, memberId: self });

    expect(broadcaster.invitationEnded).not.toHaveBeenCalled();
    expect(broadcaster.callEnded).not.toHaveBeenCalled();
  });
});
