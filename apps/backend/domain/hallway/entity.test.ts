import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { canInvite, isBusy } from "./entity";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

const m1 = "m1" as MemberId;
const m2 = "m2" as MemberId;
const roomId = "room-abc-1234" as RoomId;
const invitationId = "inv-1" as InvitationId;
const callId = "call-1" as CallId;
const expiresAt = "2026-04-20T09:00:10.000Z";

const buildInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: invitationId,
  roomId,
  fromMemberId: m1,
  toMemberId: m2,
  expiresAt,
  ...overrides,
});

const buildCall = (overrides: Partial<Call> = {}): Call => ({
  id: callId,
  roomId,
  memberIds: [m1, m2],
  startedAt: "2026-04-20T08:55:00.000Z",
  ...overrides,
});

const valid = {
  inviter: { id: m1, busy: false },
  invitee: { id: m2, busy: false, present: true },
};

describe("canInvite", () => {
  it("全ての条件を満たすときは何も投げずに返る", () => {
    expect(() => canInvite(valid)).not.toThrow();
  });

  it("自分自身を招待しようとすると SelfInviteNotAllowed を投げる", () => {
    expect(() => canInvite({ ...valid, invitee: { ...valid.invitee, id: m1 } })).toThrow(
      SelfInviteNotAllowed,
    );
  });

  it("inviter が busy のときは InviterBusy を投げる", () => {
    expect(() => canInvite({ ...valid, inviter: { ...valid.inviter, busy: true } })).toThrow(
      InviterBusy,
    );
  });

  it("invitee が present でないときは InviteeUnavailable を投げる", () => {
    expect(() => canInvite({ ...valid, invitee: { ...valid.invitee, present: false } })).toThrow(
      InviteeUnavailable,
    );
  });

  it("invitee が busy のときは InviteeUnavailable を投げる", () => {
    expect(() => canInvite({ ...valid, invitee: { ...valid.invitee, busy: true } })).toThrow(
      InviteeUnavailable,
    );
  });

  it("self-invite は inviter busy / invitee 条件より先に判定する", () => {
    expect(() =>
      canInvite({
        inviter: { id: m1, busy: true },
        invitee: { id: m1, busy: true, present: false },
      }),
    ).toThrow(SelfInviteNotAllowed);
  });
});

describe("isBusy", () => {
  it("発信中招待もない、着信中招待もない、通話もないときは取り込み中ではない", () => {
    expect(isBusy({ outgoing: null, incoming: null, call: null })).toBe(false);
  });

  it("発信中の招待が立っているときは取り込み中と判定する", () => {
    expect(isBusy({ outgoing: buildInvitation(), incoming: null, call: null })).toBe(true);
  });

  it("着信中の招待が立っているときは取り込み中と判定する", () => {
    expect(isBusy({ outgoing: null, incoming: buildInvitation(), call: null })).toBe(true);
  });

  it("通話に参加しているときは取り込み中と判定する", () => {
    expect(isBusy({ outgoing: null, incoming: null, call: buildCall() })).toBe(true);
  });
});
