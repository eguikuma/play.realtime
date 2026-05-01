import type { CallId, InvitationId, MemberId } from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import {
  CallNotFound,
  InvitationNotFound,
  InviteeUnavailable,
  InviterBusy,
  NotCallParticipant,
  SelfInviteNotAllowed,
} from "../../domain/hallway/errors";
import { hallwayErrorCodeOf } from "./hallway-errors";

const memberId = "m-1" as MemberId;
const invitationId = "iv-1" as InvitationId;
const callId = "c-1" as CallId;

describe("hallwayErrorCodeOf", () => {
  it("自己招待の例外には SelfInviteNotAllowed のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new SelfInviteNotAllowed(memberId))).toBe("SelfInviteNotAllowed");
  });

  it("招待元が取り込み中の例外には InviterBusy のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new InviterBusy(memberId))).toBe("InviterBusy");
  });

  it("招待先が応答不可の例外には InviteeUnavailable のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new InviteeUnavailable(memberId))).toBe("InviteeUnavailable");
  });

  it("招待が見つからない例外には InvitationNotFound のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new InvitationNotFound(invitationId))).toBe("InvitationNotFound");
  });

  it("通話が見つからない例外には CallNotFound のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new CallNotFound(callId))).toBe("CallNotFound");
  });

  it("通話の非参加者による操作の例外には NotCallParticipant のコードを引き当てる", () => {
    expect(hallwayErrorCodeOf(new NotCallParticipant(callId, memberId))).toBe("NotCallParticipant");
  });

  it("対応表に無い例外には `null` を返して従来の警告ログ経路へ任せる", () => {
    expect(hallwayErrorCodeOf(new Error("想定外"))).toBeNull();
    expect(hallwayErrorCodeOf("文字列として飛んできた値")).toBeNull();
    expect(hallwayErrorCodeOf(null)).toBeNull();
  });
});
