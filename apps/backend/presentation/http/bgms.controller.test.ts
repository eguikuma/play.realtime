import type { BgmState, ConnectionId, MemberId, RoomId, TrackId } from "@play.realtime/contracts";
import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { GetBgmSnapshot } from "../../application/bgm/get-snapshot.usecase";
import type { SetBgm } from "../../application/bgm/set.usecase";
import type { StopBgm } from "../../application/bgm/stop.usecase";
import type { UndoBgm } from "../../application/bgm/undo.usecase";
import type { RoomPresence } from "../../application/room/presence";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { InMemoryRoomPresence } from "../../infrastructure/presence/in-memory";
import { SseConnection, type SseHub } from "../../infrastructure/transport/sse";
import { BgmsController } from "./bgms.controller";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const connectionId = "connection-1" as ConnectionId;
const trackId = "Blues" as TrackId;
const emptyState: BgmState = { current: null, undoable: null };

const buildController = (
  overrides: {
    setter?: Partial<SetBgm>;
    stopper?: Partial<StopBgm>;
    undoer?: Partial<UndoBgm>;
    snapshot?: Partial<GetBgmSnapshot>;
    presence?: RoomPresence;
    hub?: Partial<SseHub>;
    ids?: Partial<NanoidIdGenerator>;
  } = {},
) => {
  const setter = {
    execute: vi.fn(async () => emptyState),
    ...overrides.setter,
  } as unknown as SetBgm;
  const stopper = {
    execute: vi.fn(async () => emptyState),
    ...overrides.stopper,
  } as unknown as StopBgm;
  const undoer = {
    execute: vi.fn(async () => emptyState),
    ...overrides.undoer,
  } as unknown as UndoBgm;
  const snapshot = {
    execute: vi.fn(async () => ({ state: emptyState })),
    ...overrides.snapshot,
  } as unknown as GetBgmSnapshot;
  const presence = overrides.presence ?? new InMemoryRoomPresence();
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
    controller: new BgmsController(setter, stopper, undoer, snapshot, presence, hub, ids),
    setter,
    stopper,
    undoer,
    snapshot,
    presence,
    hub,
    ids,
  };
};

describe("BgmsController", () => {
  it("POST で trackId を SetBgm に委譲する", async () => {
    const { controller, setter } = buildController();

    await controller.set(roomId, { trackId }, { id: memberId });

    expect(setter.execute).toHaveBeenCalledWith(
      expect.objectContaining({ roomId, memberId, trackId }),
    );
  });

  it("POST stop は StopBgm を呼ぶ", async () => {
    const { controller, stopper } = buildController();

    await controller.stop(roomId, { id: memberId });

    expect(stopper.execute).toHaveBeenCalledWith(expect.objectContaining({ roomId, memberId }));
  });

  it("POST undo は UndoBgm を呼ぶ", async () => {
    const { controller, undoer } = buildController();

    await controller.undo(roomId, { id: memberId });

    expect(undoer.execute).toHaveBeenCalledWith(expect.objectContaining({ roomId, memberId }));
  });

  it("ストリーム取得では SSE 接続を作り bgm トピックに紐付ける", () => {
    const { controller, hub } = buildController();
    const response = { on: vi.fn() } as unknown as Response;

    controller.stream(roomId, { id: memberId }, response);

    expect(hub.attach).toHaveBeenCalledOnce();
    const [connection, options] = (hub.attach as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(connection).toBeInstanceOf(SseConnection);
    expect(options.topic).toBe(`room:${roomId}:bgm`);
  });

  it("onAttach では Snapshot を該当接続に直送する", async () => {
    const { controller, hub, snapshot } = buildController();
    const response = { on: vi.fn() } as unknown as Response;

    controller.stream(roomId, { id: memberId }, response);

    const attachCall = (hub.attach as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(attachCall).toBeDefined();
    const options = attachCall?.[1];
    const attached = { emit: vi.fn() };
    await options.onAttach(attached);

    expect(snapshot.execute).toHaveBeenCalledWith({ roomId });
    expect(attached.emit).toHaveBeenCalledWith("Snapshot", { state: emptyState });
  });
});
