import { Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { type MemberId, type Murmur, PostMurmurRequest, RoomId } from "@play.realtime/contracts";
import type { Response } from "express";
import { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import { PostMurmur } from "../../application/murmur/post.usecase";
import { topic } from "../../application/murmur/topic";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { SseConnection, SseHub } from "../../infrastructure/transport/sse";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";

/**
 * ひとことの投稿と SSE 配信を担う HTTP コントローラ
 * 全エンドポイントで `RequireMember` ガードを通し 部外者からの投稿を拒絶する
 */
@Controller("rooms/:roomId/murmurs")
@UseGuards(RequireMember)
export class MurmursController {
  /**
   * 投稿とスナップショットのユースケース そして SSE ハブと ID 生成器を依存性注入で受け取る
   */
  constructor(
    private readonly posting: PostMurmur,
    private readonly snapshot: GetMurmurSnapshot,
    private readonly hub: SseHub,
    private readonly ids: NanoidIdGenerator,
  ) {}

  /**
   * ひとことを 1 件投稿し ルーム全員に `Posted` を配信する
   */
  @Post()
  async create(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(PostMurmurRequest)) body: PostMurmurRequest,
    @CurrentMember() member: { id: MemberId },
  ): Promise<Murmur> {
    return this.posting.execute({
      roomId,
      memberId: member.id,
      text: body.text,
    });
  }

  /**
   * SSE ストリームを開始し 接続直後に直近 50 件を `Snapshot` として直送する
   */
  @Get("stream")
  stream(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() member: { id: MemberId },
    @Res() response: Response,
  ): void {
    const connection = new SseConnection(this.ids.connection(), member.id, roomId, response);
    this.hub.attach(connection, {
      topic: topic(roomId),
      onAttach: async (attached) => {
        const items = await this.snapshot.execute({ roomId });
        attached.emit("Snapshot", { items });
      },
    });
  }
}
