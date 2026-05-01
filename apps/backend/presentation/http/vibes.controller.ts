import { Body, Controller, Get, Logger, Param, Post, Res, UseGuards } from "@nestjs/common";
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
 * 空気の SSE 配信と状態変更を担う HTTP コントローラ
 * 全エンドポイントで `RequireMember` ガードを通し 部外者からの観測と変更を拒絶する
 */
@Controller("rooms/:roomId/vibe")
@UseGuards(RequireMember)
export class VibesController {
  /**
   * 調査用 偶発 Left 未配信の切り分けで一時的に差し込むロガー
   */
  private readonly probe = new Logger("VibeLeftProbe");

  /**
   * 空気の 4 つのユースケースと 参加情報の取得 SSE ハブ ID 生成器を依存性注入で受け取る
   */
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
   * SSE ストリームを開始し 接続直後に `Welcome` `Snapshot` `Joined` の順で送る
   * 切断時は離脱通知のユースケースを起動し 猶予越しに `Left` または `Update` を配信する
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
    @Res() response: Response,
  ): void {
    const connectionId = this.ids.connection() as ConnectionId;
    this.probe.log(
      `stream:open roomId=${roomId} memberId=${member.id} connectionId=${connectionId}`,
    );
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
      this.probe.log(
        `stream:close roomId=${roomId} memberId=${member.id} connectionId=${connectionId}`,
      );
      this.presence.deregister(roomId);
      void this.notifyLeft.execute({ roomId, memberId: member.id, connectionId });
    });
  }

  /**
   * 指定接続の空気を変更し ルーム全員へ集約後の `Update` を配信する
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
