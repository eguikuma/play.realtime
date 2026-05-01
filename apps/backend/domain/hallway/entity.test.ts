import type { MemberId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { canInvite } from "./entity";
import { InviteeUnavailable, InviterBusy, SelfInviteNotAllowed } from "./errors";

const m1 = "m1" as MemberId;
const m2 = "m2" as MemberId;

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
