import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryHallwayRepository } from "./hallway";

const roomId = "room-abc-1234" as RoomId;
const inviterId = "m1" as MemberId;
const inviteeId = "m2" as MemberId;
const invitationId = "inv-1" as InvitationId;
const callId = "call-1" as CallId;

const invitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: invitationId,
  roomId,
  fromMemberId: inviterId,
  toMemberId: inviteeId,
  expiresAt: "2026-04-20T09:00:10.000Z",
  ...overrides,
});

const call = (overrides: Partial<Call> = {}): Call => ({
  id: callId,
  roomId,
  memberIds: [inviterId, inviteeId],
  startedAt: "2026-04-20T09:00:30.000Z",
  ...overrides,
});

describe("InMemoryHallwayRepository", () => {
  it("招待を保存すると id / from / to いずれからも取得できる", async () => {
    const repository = new InMemoryHallwayRepository();

    await repository.saveInvitation(invitation());

    expect(await repository.findInvitation(invitationId)).toEqual(invitation());
    expect(await repository.findOutgoingInvitation(inviterId)).toEqual(invitation());
    expect(await repository.findIncomingInvitation(inviteeId)).toEqual(invitation());
  });

  it("ルーム単位で全招待を取得できる", async () => {
    const repository = new InMemoryHallwayRepository();
    const another: Invitation = invitation({
      id: "inv-2" as InvitationId,
      fromMemberId: "m3" as MemberId,
      toMemberId: "m4" as MemberId,
    });
    await repository.saveInvitation(invitation());
    await repository.saveInvitation(another);

    const list = await repository.findAllInvitationsInRoom(roomId);

    expect(list).toHaveLength(2);
    expect(list).toEqual(expect.arrayContaining([invitation(), another]));
  });

  it("招待を削除すると招待本体と逆引きインデックスの両方を破棄する", async () => {
    const repository = new InMemoryHallwayRepository();
    await repository.saveInvitation(invitation());

    await repository.deleteInvitation(invitationId);

    expect(await repository.findInvitation(invitationId)).toBeNull();
    expect(await repository.findOutgoingInvitation(inviterId)).toBeNull();
    expect(await repository.findIncomingInvitation(inviteeId)).toBeNull();
    expect(await repository.findAllInvitationsInRoom(roomId)).toEqual([]);
  });

  it("通話を保存すると id / 参加者いずれからも取得できる", async () => {
    const repository = new InMemoryHallwayRepository();

    await repository.saveCall(call());

    expect(await repository.findCall(callId)).toEqual(call());
    expect(await repository.findCallForMember(inviterId)).toEqual(call());
    expect(await repository.findCallForMember(inviteeId)).toEqual(call());
  });

  it("ルーム単位で全通話を取得できる", async () => {
    const repository = new InMemoryHallwayRepository();
    const another: Call = call({
      id: "call-2" as CallId,
      memberIds: ["m3" as MemberId, "m4" as MemberId],
    });
    await repository.saveCall(call());
    await repository.saveCall(another);

    const list = await repository.findAllCallsInRoom(roomId);

    expect(list).toHaveLength(2);
    expect(list).toEqual(expect.arrayContaining([call(), another]));
  });

  it("通話を削除すると通話本体と全参加者の逆引きインデックスを破棄する", async () => {
    const repository = new InMemoryHallwayRepository();
    await repository.saveCall(call());

    await repository.deleteCall(callId);

    expect(await repository.findCall(callId)).toBeNull();
    expect(await repository.findCallForMember(inviterId)).toBeNull();
    expect(await repository.findCallForMember(inviteeId)).toBeNull();
    expect(await repository.findAllCallsInRoom(roomId)).toEqual([]);
  });

  it("存在しない招待や通話の削除では何もせず例外を投げない", async () => {
    const repository = new InMemoryHallwayRepository();

    await expect(repository.deleteInvitation("absent" as InvitationId)).resolves.toBeUndefined();
    await expect(repository.deleteCall("absent" as CallId)).resolves.toBeUndefined();
  });

  it("ルーム単位の取り除きで配下の招待と通話と全逆引き索引が破棄される", async () => {
    const repository = new InMemoryHallwayRepository();
    const keepRoomId = "room-keep-0000" as RoomId;
    const keepInvitation = invitation({
      id: "inv-keep" as InvitationId,
      roomId: keepRoomId,
      fromMemberId: "m9" as MemberId,
      toMemberId: "m10" as MemberId,
    });

    await repository.saveInvitation(invitation());
    await repository.saveCall(call());
    await repository.saveInvitation(keepInvitation);

    await repository.remove(roomId);

    expect(await repository.findInvitation(invitationId)).toBeNull();
    expect(await repository.findOutgoingInvitation(inviterId)).toBeNull();
    expect(await repository.findIncomingInvitation(inviteeId)).toBeNull();
    expect(await repository.findAllInvitationsInRoom(roomId)).toEqual([]);
    expect(await repository.findCall(callId)).toBeNull();
    expect(await repository.findCallForMember(inviterId)).toBeNull();
    expect(await repository.findCallForMember(inviteeId)).toBeNull();
    expect(await repository.findAllCallsInRoom(roomId)).toEqual([]);
    expect(await repository.findInvitation("inv-keep" as InvitationId)).toEqual(keepInvitation);
  });

  it("存在しないルームを取り除いても例外を投げない", async () => {
    const repository = new InMemoryHallwayRepository();

    await expect(repository.remove("room-none" as RoomId)).resolves.toBeUndefined();
  });
});
