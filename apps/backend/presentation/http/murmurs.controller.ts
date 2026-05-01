import { Body, Controller, Get, Inject, Param, Post, Res, UseGuards } from "@nestjs/common";
import { type Murmur, PostMurmurRequest, RoomId } from "@play.realtime/contracts";
import type { Response } from "express";
import { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import { PostMurmur } from "../../application/murmur/post.usecase";
import { topic } from "../../application/murmur/topic";
import { RoomPresence } from "../../application/room/presence";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, SseHub } from "../../infrastructure/transport/sse";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";

/**
 * `/rooms/{roomId}/murmurs` Controller、投稿作成と SSE 配信を提供する
 * `RequireMember` ガードが全経路に掛かるため、未入室セッションは 401 で入室フォームに誘導される
 */
@Controller("rooms/:roomId/murmurs")
@UseGuards(RequireMember)
export class MurmursController {
  constructor(
    private readonly posting: PostMurmur,
    private readonly snapshot: GetMurmurSnapshot,
    @Inject(RoomPresence) private readonly presence: RoomPresence,
    private readonly hub: SseHub,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * `POST /rooms/{roomId}/murmurs` ひとことを投稿する
   * 本文のみを受けて usecase 側が永続化と `Posted` 配信を行う
   */
  @Post()
  async create(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(PostMurmurRequest)) body: PostMurmurRequest,
    @CurrentMember() member: CurrentMember,
  ): Promise<Murmur> {
    return this.posting.execute({
      roomId,
      memberId: member.id,
      text: body.text,
    });
  }

  /**
   * `GET /rooms/{roomId}/murmurs/stream` ひとことの SSE 購読経路
   * 接続成立時に `RoomPresence` へ 1 接続として記録し、切断時に `deregister` を呼ぶ
   * `onAttach` で購読成立直後に `Snapshot` を送出して、遅れて参加したクライアントも過去の流れを再構築できる
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: CurrentMember,
    @Res() response: Response,
  ): void {
    const connection = new SseConnection(this.ids.connection(), member.id, roomId, response);
    this.presence.register(roomId);
    this.hub.attach(connection, {
      topic: topic(roomId),
      onAttach: async (attached) => {
        const items = await this.snapshot.execute({ roomId });
        attached.emit("Snapshot", { items });
      },
    });
    connection.onClose(() => {
      this.presence.deregister(roomId);
    });
  }
}
