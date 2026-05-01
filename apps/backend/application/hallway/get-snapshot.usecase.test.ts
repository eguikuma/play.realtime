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
import { GetHallwaySnapshot } from "./get-snapshot.usecase";

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

describe("GetHallwaySnapshot", () => {
  it("ルーム内の全招待と全通話を返す", async () => {
    const invitation: Invitation = {
      id: "inv-1" as InvitationId,
      roomId,
      fromMemberId: self,
      toMemberId: peer,
      expiresAt: "2026-04-20T09:00:10.000Z",
    };
    const call: Call = {
      id: "call-1" as CallId,
      roomId,
      memberIds: [self, peer],
      startedAt: "2026-04-20T09:00:30.000Z",
    };
    const usecase = new GetHallwaySnapshot(
      buildHallway({
        findAllInvitationsInRoom: vi.fn(async () => [invitation]),
        findAllCallsInRoom: vi.fn(async () => [call]),
      }),
    );

    const snapshot = await usecase.execute({ roomId });

    expect(snapshot).toEqual({ invitations: [invitation], calls: [call] });
  });

  it("何もないときは invitations と calls を空配列で返す", async () => {
    const usecase = new GetHallwaySnapshot(buildHallway());

    expect(await usecase.execute({ roomId })).toEqual({ invitations: [], calls: [] });
  });
});
