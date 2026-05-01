import { type MemberId, type Murmur, type MurmurId, type RoomId } from "@play.realtime/contracts";
import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import type { PostMurmur } from "../../application/murmur/post.usecase";
import { RoomPresence } from "../../application/room/presence";
import type { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, type SseHub } from "../../infrastructure/transport/sse";
import { MurmursController } from "./murmurs.controller";

const roomId = "room-abc-1234" as RoomId;
const memberId = "member-alice" as MemberId;
const murmurId = "murmur-1" as MurmurId;

const buildMurmur = (): Murmur => ({
  id: murmurId,
  roomId,
  memberId,
  text: "hello",
  postedAt: "2026-04-18T12:00:00.000Z",
});

const buildController = (
  overrides: {
    posting?: Partial<PostMurmur>;
    snapshot?: Partial<GetMurmurSnapshot>;
    presence?: RoomPresence;
    hub?: Partial<SseHub>;
    ids?: Partial<NanoidIdGenerator>;
  } = {},
) => {
  const posting = {
    execute: vi.fn(async () => buildMurmur()),
    ...overrides.posting,
  } as unknown as PostMurmur;
  const snapshot = {
    execute: vi.fn(async () => []),
    ...overrides.snapshot,
  } as unknown as GetMurmurSnapshot;
  const presence = overrides.presence ?? new RoomPresence();
  const hub = {
    attach: vi.fn(),
    broadcast: vi.fn(),
    ...overrides.hub,
  } as unknown as SseHub;
  const ids = {
    connection: vi.fn(() => "connection-1"),
    ...overrides.ids,
  } as unknown as NanoidIdGenerator;
  return {
    controller: new MurmursController(posting, snapshot, presence, hub, ids),
    posting,
    snapshot,
    presence,
    hub,
    ids,
  };
};

describe("MurmursController", () => {
  it("投稿リクエストを一言投稿ユースケースに委譲する", async () => {
    const { controller, posting } = buildController();

    await controller.create(roomId, { text: "hello" }, { id: memberId });

    expect(posting.execute).toHaveBeenCalledWith({
      roomId,
      memberId,
      text: "hello",
    });
  });

  it("ストリーム取得では SSE 接続を作り一言トピックに紐付ける", () => {
    const { controller, hub } = buildController();
    const response = { on: vi.fn() } as unknown as Response;

    controller.stream(roomId, { id: memberId }, response);

    expect(hub.attach).toHaveBeenCalledOnce();
    const [connection, options] = (hub.attach as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(connection).toBeInstanceOf(SseConnection);
    expect(options.topic).toBe(`room:${roomId}:murmur`);
  });
});
