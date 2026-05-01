import type {
  CallId,
  HallwayCallEnded,
  HallwayCallStarted,
  HallwayInvitationEnded,
  HallwayInvited,
  HallwayMessage,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import { describe, expect, it, vi } from "vitest";
import type { WsHub } from "../../infrastructure/transport/ws";
import { HallwayBroadcaster } from "./broadcaster";
import { Topic } from "./topic";

const roomId = "room-1" as RoomId;
const inviterId = "inviter" as MemberId;
const inviteeId = "invitee" as MemberId;
const invitationId = "inv-1" as InvitationId;
const callId = "call-1" as CallId;

const buildHub = (): WsHub =>
  ({
    broadcast: vi.fn(async () => {}),
  }) as unknown as WsHub;

const buildInvited = (): HallwayInvited => ({
  invitation: {
    id: invitationId,
    roomId,
    fromMemberId: inviterId,
    toMemberId: inviteeId,
    expiresAt: new Date("2026-04-30T00:00:30.000Z").toISOString(),
  } as Invitation,
});

const buildInvitationEnded = (): HallwayInvitationEnded => ({
  invitationId,
  reason: "cancelled",
});

const buildCallStarted = (): HallwayCallStarted => ({
  call: {
    id: callId,
    roomId,
    memberIds: [inviterId, inviteeId],
    startedAt: new Date("2026-04-30T00:00:00.000Z").toISOString(),
  },
});

const buildCallEnded = (): HallwayCallEnded => ({
  callId,
  reason: "explicit",
});

const buildMessage = (): HallwayMessage => ({
  message: {
    callId,
    fromMemberId: inviterId,
    text: "hi",
    sentAt: new Date("2026-04-30T00:00:00.000Z").toISOString(),
  },
});

describe("HallwayBroadcaster", () => {
  it("`Invited` をルーム単位トピックに 1 回だけ配信する", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildInvited();

    await broadcaster.invited(roomId, data);

    expect(hub.broadcast).toHaveBeenCalledTimes(1);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.room(roomId), "Invited", data);
  });

  it("`InvitationEnded` をルーム単位トピックに 1 回だけ配信する", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildInvitationEnded();

    await broadcaster.invitationEnded(roomId, data);

    expect(hub.broadcast).toHaveBeenCalledTimes(1);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.room(roomId), "InvitationEnded", data);
  });

  it("`CallStarted` をルーム単位トピックに 1 回だけ配信する", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildCallStarted();

    await broadcaster.callStarted(roomId, data);

    expect(hub.broadcast).toHaveBeenCalledTimes(1);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.room(roomId), "CallStarted", data);
  });

  it("`CallEnded` をルーム単位トピックに 1 回だけ配信する", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildCallEnded();

    await broadcaster.callEnded(roomId, data);

    expect(hub.broadcast).toHaveBeenCalledTimes(1);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.room(roomId), "CallEnded", data);
  });

  it("`Message` を通話参加者ぶんのメンバー単位トピックに分けて配信する", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildMessage();

    await broadcaster.message(roomId, [inviterId, inviteeId], data);

    expect(hub.broadcast).toHaveBeenCalledTimes(2);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.message(roomId, inviterId), "Message", data);
    expect(hub.broadcast).toHaveBeenCalledWith(Topic.message(roomId, inviteeId), "Message", data);
  });

  it("`Message` のメンバー単位トピックはルーム単位トピックと別経路で参加者以外に漏れない", async () => {
    const hub = buildHub();
    const broadcaster = new HallwayBroadcaster(hub);
    const data = buildMessage();

    await broadcaster.message(roomId, [inviterId, inviteeId], data);

    const calls = (hub.broadcast as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const topics = calls.map((entry) => entry[0]);
    expect(topics).not.toContain(Topic.room(roomId));
    expect(topics).toContain(Topic.message(roomId, inviterId));
    expect(topics).toContain(Topic.message(roomId, inviteeId));
  });
});
