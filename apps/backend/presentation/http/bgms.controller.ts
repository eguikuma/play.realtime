import { Body, Controller, Get, Inject, Param, Post, Res, UseGuards } from "@nestjs/common";
import { type BgmState, RoomId, SetBgmRequest } from "@play.realtime/contracts";
import type { Response } from "express";
import { GetBgmSnapshot } from "../../application/bgm/get-snapshot.usecase";
import { SetBgm } from "../../application/bgm/set.usecase";
import { StopBgm } from "../../application/bgm/stop.usecase";
import { topic } from "../../application/bgm/topic";
import { UndoBgm } from "../../application/bgm/undo.usecase";
import { RoomPresence } from "../../application/room/presence";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, SseHub } from "../../infrastructure/transport/sse";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";

/**
 * `/rooms/{roomId}/bgm` Controller、BGM の SSE 購読と再生、停止、undo の操作を提供する
 * `RequireMember` ガードが全経路に掛かるため、未入室セッションは 401 で入室フォームに誘導される
 */
@Controller("rooms/:roomId/bgm")
@UseGuards(RequireMember)
export class BgmsController {
  constructor(
    private readonly setter: SetBgm,
    private readonly stopper: StopBgm,
    private readonly undoer: UndoBgm,
    private readonly snapshot: GetBgmSnapshot,
    @Inject(RoomPresence) private readonly presence: RoomPresence,
    private readonly hub: SseHub,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * `GET /rooms/{roomId}/bgm/stream` BGM の SSE 購読経路
   * 購読成立直後に `Snapshot` を送り、以降は `Changed` イベントで操作反映を逐次配信する
   * 接続数は `RoomPresence` に register して、無人遷移の判定に参加させる
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: CurrentMember,
    @Res() response: Response,
  ): void {
    const connectionId = this.ids.connection();
    const connection = new SseConnection(connectionId, member.id, roomId, response);
    this.presence.register(roomId);
    this.hub.attach(connection, {
      topic: topic(roomId),
      onAttach: async (attached) => {
        const snapshot = await this.snapshot.execute({ roomId });
        attached.emit("Snapshot", snapshot);
      },
    });
    connection.onClose(() => {
      this.presence.deregister(roomId);
    });
  }

  /**
   * `POST /rooms/{roomId}/bgm` 指定トラックへ切り替える
   * `SetBgm` usecase が undo 窓を開いて `Changed` を配信する
   */
  @Post()
  async set(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(SetBgmRequest)) body: SetBgmRequest,
    @CurrentMember() member: CurrentMember,
  ): Promise<BgmState> {
    return this.setter.execute({
      roomId,
      memberId: member.id,
      trackId: body.trackId,
      now: new Date(),
    });
  }

  /**
   * `POST /rooms/{roomId}/bgm/stop` 再生を停止して無音にする
   * `StopBgm` usecase が undo 窓を開いて `Changed` を配信する
   */
  @Post("stop")
  async stop(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: CurrentMember,
  ): Promise<BgmState> {
    return this.stopper.execute({ roomId, memberId: member.id, now: new Date() });
  }

  /**
   * `POST /rooms/{roomId}/bgm/undo` 直前操作を取り消す
   * undo 窓が開いている間だけ他メンバーが呼べる
   */
  @Post("undo")
  async undo(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: CurrentMember,
  ): Promise<BgmState> {
    return this.undoer.execute({ roomId, memberId: member.id, now: new Date() });
  }
}
