import { type ConnectionId, type MemberId, type RoomId } from "@play.realtime/contracts";
import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { GetRoomMembership } from "../../application/room/get-membership.usecase";
import type { ChangeVibeStatus } from "../../application/vibe/change-status.usecase";
import type { GetVibeSnapshot } from "../../application/vibe/get-snapshot.usecase";
import type { NotifyVibeJoined } from "../../application/vibe/notify-joined.usecase";
import type { NotifyVibeLeft } from "../../application/vibe/notify-left.usecase";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, type SseHub } from "../../infrastructure/transport/sse";
import { VibesController } from "./vibes.controller";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const connectionId = "connection-1" as ConnectionId;

const buildController = (
  overrides: {
    snapshot?: Partial<GetVibeSnapshot>;
    notifyJoined?: Partial<NotifyVibeJoined>;
    notifyLeft?: Partial<NotifyVibeLeft>;
    changeStatus?: Partial<ChangeVibeStatus>;
    membership?: Partial<GetRoomMembership>;
    hub?: Partial<SseHub>;
    ids?: Partial<NanoidIdGenerator>;
  } = {},
) => {
  const snapshot = {
    execute: vi.fn(async () => ({ members: [], statuses: [] })),
    ...overrides.snapshot,
  } as unknown as GetVibeSnapshot;
  const notifyJoined = {
    execute: vi.fn(async () => undefined),
    ...overrides.notifyJoined,
  } as unknown as NotifyVibeJoined;
  const notifyLeft = {
    execute: vi.fn(async () => undefined),
    ...overrides.notifyLeft,
  } as unknown as NotifyVibeLeft;
  const changeStatus = {
    execute: vi.fn(async () => undefined),
    ...overrides.changeStatus,
  } as unknown as ChangeVibeStatus;
  const membership = {
    execute: vi.fn(async () => ({
      room: { id: roomId, hostMemberId: memberId, members: [], createdAt: "" },
      member: { id: memberId, name: "alice", joinedAt: "" },
    })),
    ...overrides.membership,
  } as unknown as GetRoomMembership;
  const hub = {
    attach: vi.fn(),
    broadcast: vi.fn(),
    ...overrides.hub,
  } as unknown as SseHub;
  const ids = {
    connection: vi.fn(() => connectionId),
    ...overrides.ids,
  } as unknown as NanoidIdGenerator;
  return {
    controller: new VibesController(
      snapshot,
      notifyJoined,
      notifyLeft,
      changeStatus,
      membership,
      hub,
      ids,
    ),
    snapshot,
    notifyJoined,
    notifyLeft,
    changeStatus,
    membership,
    hub,
    ids,
  };
};

describe("VibesController", () => {
  it("ステータス変更リクエストでは connectionId と status を ChangeVibeStatus に委譲する", async () => {
    const { controller, changeStatus } = buildController();

    await controller.change(roomId, { connectionId, status: "focused" }, { id: memberId });

    expect(changeStatus.execute).toHaveBeenCalledWith({
      roomId,
      memberId,
      connectionId,
      status: "focused",
    });
  });

  it("ストリーム取得では SSE 接続を作り vibe トピックに紐付ける", () => {
    const { controller, hub } = buildController();
    const response = { on: vi.fn() } as unknown as Response;

    controller.stream(roomId, { id: memberId }, response);

    expect(hub.attach).toHaveBeenCalledOnce();
    const [connection, options] = (hub.attach as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(connection).toBeInstanceOf(SseConnection);
    expect(options.topic).toBe(`room:${roomId}:vibe`);
  });

  it("onAttach では Welcome を該当接続に直送してから Snapshot と NotifyVibeJoined を実行する", async () => {
    const { controller, hub, snapshot, notifyJoined } = buildController();
    const response = { on: vi.fn() } as unknown as Response;

    controller.stream(roomId, { id: memberId }, response);

    const attachCall = (hub.attach as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(attachCall).toBeDefined();
    const options = attachCall?.[1];
    const attached = { emit: vi.fn() };
    await options.onAttach(attached);

    expect(attached.emit).toHaveBeenNthCalledWith(1, "Welcome", { connectionId });
    expect(snapshot.execute).toHaveBeenCalledWith({ roomId });
    expect(attached.emit).toHaveBeenNthCalledWith(2, "Snapshot", expect.anything());
    expect(notifyJoined.execute).toHaveBeenCalledWith(
      expect.objectContaining({ roomId, connectionId }),
    );
  });
});
