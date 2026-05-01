import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import {
  ChangeVibeStatusRequest,
  type ConnectionId,
  type MemberId,
  RoomId,
} from "@play.realtime/contracts";
import type { Response } from "express";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { RoomPresence } from "../../application/room/presence";
import { ChangeVibeStatus } from "../../application/vibe/change-status.usecase";
import { GetVibeSnapshot } from "../../application/vibe/get-snapshot.usecase";
import { NotifyVibeJoined } from "../../application/vibe/notify-joined.usecase";
import { NotifyVibeLeft } from "../../application/vibe/notify-left.usecase";
import { topic } from "../../application/vibe/topic";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, SseHub } from "../../infrastructure/transport/sse";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";

/**
 * `/rooms/{roomId}/vibe` Controller、SSE 購読と可視状態変更 POST を提供する
 * `RequireMember` ガードが全経路に掛かるため、未入室セッションは 401 で入室フォームに誘導される
 */
@Controller("rooms/:roomId/vibe")
@UseGuards(RequireMember)
export class VibesController {
  constructor(
    private readonly snapshot: GetVibeSnapshot,
    private readonly notifyJoined: NotifyVibeJoined,
    private readonly notifyLeft: NotifyVibeLeft,
    private readonly changeStatus: ChangeVibeStatus,
    private readonly membership: GetRoomMembership,
    private readonly presence: RoomPresence,
    private readonly hub: SseHub,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * `GET /rooms/{roomId}/vibe/stream` Vibe の SSE 購読経路
   * 接続ごとに `connectionId` を採番し、購読成立直後に `Welcome` と `Snapshot` を送ってから `NotifyVibeJoined` を走らせる
   * 切断時は `RoomPresence.deregister` と `NotifyVibeLeft` を呼び、猶予タイマーで他メンバーの画面点滅を防ぐ
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
    @Res() response: Response,
  ): void {
    const connectionId = this.ids.connection() as ConnectionId;
    const connection = new SseConnection(connectionId, member.id, roomId, response);
    this.presence.register(roomId);
    this.hub.attach(connection, {
      topic: topic(roomId),
      onAttach: async (attached) => {
        attached.emit("Welcome", { connectionId });
        const { member: resolved } = await this.membership.execute({
          roomId,
          memberId: member.id,
        });
        const snapshot = await this.snapshot.execute({ roomId });
        attached.emit("Snapshot", snapshot);
        await this.notifyJoined.execute({ roomId, member: resolved, connectionId });
      },
    });
    connection.onClose(() => {
      this.presence.deregister(roomId);
      void this.notifyLeft.execute({ roomId, memberId: member.id, connectionId });
    });
  }

  /**
   * `POST /rooms/{roomId}/vibe` クライアントの可視状態変化を受ける、ボディで `connectionId` と新しい `status` を渡す
   */
  @Post()
  async change(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(ChangeVibeStatusRequest)) body: ChangeVibeStatusRequest,
    @CurrentMember() member: { id: MemberId },
  ): Promise<void> {
    await this.changeStatus.execute({
      roomId,
      memberId: member.id,
      connectionId: body.connectionId,
      status: body.status,
    });
  }
}
