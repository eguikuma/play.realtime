import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import {
  type BgmState,
  type ConnectionId,
  type MemberId,
  RoomId,
  SetBgmRequest,
} from "@play.realtime/contracts";
import type { Response } from "express";
import { GetBgmSnapshot } from "../../application/bgm/get-snapshot.usecase";
import { SetBgm } from "../../application/bgm/set.usecase";
import { StopBgm } from "../../application/bgm/stop.usecase";
import { topic } from "../../application/bgm/topic";
import { UndoBgm } from "../../application/bgm/undo.usecase";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, SseHub } from "../../infrastructure/transport/sse";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";

/**
 * BGM の SSE 配信と 設定 停止 undo の操作を担う HTTP コントローラ
 * 全エンドポイントで `RequireMember` ガードを通し 部外者からの書き込みを拒絶する
 */
@Controller("rooms/:roomId/bgm")
@UseGuards(RequireMember)
export class BgmsController {
  /**
   * BGM に関わる 4 つのユースケースと SSE ハブと ID 生成器を依存性注入で受け取る
   */
  constructor(
    private readonly setter: SetBgm,
    private readonly stopper: StopBgm,
    private readonly undoer: UndoBgm,
    private readonly snapshot: GetBgmSnapshot,
    private readonly hub: SseHub,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * SSE ストリームを開始し 接続直後に最新の BGM 状態を `Snapshot` として直送する
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
    @Res() response: Response,
  ): void {
    const connectionId = this.ids.connection() as ConnectionId;
    const connection = new SseConnection(connectionId, member.id, roomId, response);
    this.hub.attach(connection, {
      topic: topic(roomId),
      onAttach: async (attached) => {
        const snapshot = await this.snapshot.execute({ roomId });
        attached.emit("Snapshot", snapshot);
      },
    });
  }

  /**
   * BGM を指定の楽曲へ切り替え ルーム全員に `Changed` を配信する
   */
  @Post()
  async set(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(SetBgmRequest)) body: SetBgmRequest,
    @CurrentMember() member: { id: MemberId },
  ): Promise<BgmState> {
    return this.setter.execute({
      roomId,
      memberId: member.id,
      trackId: body.trackId,
      now: new Date(),
    });
  }

  /**
   * BGM を無音にし ルーム全員に `Changed` を配信する
   */
  @Post("stop")
  async stop(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
  ): Promise<BgmState> {
    return this.stopper.execute({ roomId, memberId: member.id, now: new Date() });
  }

  /**
   * 直前の BGM 変更を取り消し ルーム全員に `Changed` を配信する
   */
  @Post("undo")
  async undo(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
  ): Promise<BgmState> {
    return this.undoer.execute({ roomId, memberId: member.id, now: new Date() });
  }
}
