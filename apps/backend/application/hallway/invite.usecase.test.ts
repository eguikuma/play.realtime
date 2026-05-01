import type {
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
  VibeStatus,
} from "@play.realtime/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type HallwayRepository,
  InviteeUnavailable,
  InviterBusy,
  SelfInviteNotAllowed,
} from "../../domain/hallway";
import type { VibeRepository } from "../../domain/vibe";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import type { HallwayBroadcaster } from "./broadcaster";
import type { ExpireHallwayInvitation } from "./expire-invitation.usecase";
import type { HallwayInvitationTimers } from "./invitation-timers";
import { InviteHallway } from "./invite.usecase";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "inviter" as MemberId;
const inviteeId = "invitee" as MemberId;
const now = new Date("2026-04-20T09:00:00.000Z");

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

const buildVibes = (overrides: Partial<VibeRepository> = {}): VibeRepository => ({
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  snapshot: vi.fn(),
  get: vi.fn(async () => "present" as VibeStatus),
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

const buildIds = (invitationId = "invitation"): NanoidIdGenerator =>
  ({
    invitation: vi.fn(() => invitationId as InvitationId),
  }) as unknown as NanoidIdGenerator;

const buildTimers = (register = vi.fn()): HallwayInvitationTimers =>
  ({ register, cancel: vi.fn() }) as unknown as HallwayInvitationTimers;

const buildExpirer = (): ExpireHallwayInvitation =>
  ({ execute: vi.fn() }) as unknown as ExpireHallwayInvitation;

describe("InviteHallway", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("`present` かつ取り込み中ではない相手には招待を生成しルーム全員に Invited を配信する", async () => {
    const hallway = buildHallway();
    const broadcaster = buildBroadcaster();
    const usecase = new InviteHallway(
      hallway,
      buildVibes(),
      broadcaster,
      buildIds(),
      buildTimers(),
      buildExpirer(),
    );

    const invitation = await usecase.execute({ roomId, inviterId, inviteeId });

    expect(invitation).toEqual<Invitation>({
      id: "invitation" as InvitationId,
      roomId,
      fromMemberId: inviterId,
      toMemberId: inviteeId,
      expiresAt: new Date(now.getTime() + 10_000).toISOString(),
    });
    expect(hallway.saveInvitation).toHaveBeenCalledWith(invitation);
    expect(broadcaster.invited).toHaveBeenCalledWith(roomId, { invitation });
  });

  it("10 秒後に期限切れが発火するよう HallwayInvitationTimers に登録する", async () => {
    const register = vi.fn();
    const usecase = new InviteHallway(
      buildHallway(),
      buildVibes(),
      buildBroadcaster(),
      buildIds(),
      buildTimers(register),
      buildExpirer(),
    );

    await usecase.execute({ roomId, inviterId, inviteeId });

    expect(register).toHaveBeenCalledWith("invitation", 10_000, expect.any(Function));
  });

  it("自分自身を招待すると SelfInviteNotAllowed を投げる", async () => {
    const usecase = new InviteHallway(
      buildHallway(),
      buildVibes(),
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
      buildExpirer(),
    );

    await expect(
      usecase.execute({ roomId, inviterId, inviteeId: inviterId }),
    ).rejects.toBeInstanceOf(SelfInviteNotAllowed);
  });

  it("招待元が他の招待を持つときは InviterBusy を投げる", async () => {
    const existing: Invitation = {
      id: "existing" as InvitationId,
      roomId,
      fromMemberId: inviterId,
      toMemberId: "outsider" as MemberId,
      expiresAt: now.toISOString(),
    };
    const hallway = buildHallway({ findOutgoingInvitation: vi.fn(async () => existing) });
    const usecase = new InviteHallway(
      hallway,
      buildVibes(),
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
      buildExpirer(),
    );

    await expect(usecase.execute({ roomId, inviterId, inviteeId })).rejects.toBeInstanceOf(
      InviterBusy,
    );
  });

  it("招待先が `present` でないときは InviteeUnavailable を投げる", async () => {
    const vibes = buildVibes({ get: vi.fn(async () => "focused" as VibeStatus) });
    const usecase = new InviteHallway(
      buildHallway(),
      vibes,
      buildBroadcaster(),
      buildIds(),
      buildTimers(),
      buildExpirer(),
    );

    await expect(usecase.execute({ roomId, inviterId, inviteeId })).rejects.toBeInstanceOf(
      InviteeUnavailable,
    );
  });
});
