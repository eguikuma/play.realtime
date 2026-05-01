import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import {
  CreateRoomRequest,
  JoinRoomRequest,
  MemberId,
  type Room,
  RoomId,
  type RoomMembership,
} from "@play.realtime/contracts";
import type { Request, Response } from "express";
import { CreateRoom } from "../../application/room/create.usecase";
import { GetRoom } from "../../application/room/get.usecase";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { JoinRoom } from "../../application/room/join.usecase";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { MEMBER_COOKIE, MEMBER_COOKIE_OPTIONS } from "./cookies";

/**
 * ルームの発行 参加 閲覧 自己照会を司る HTTP コントローラ
 * 発行と参加では cookie を発行し 自己照会は `RequireMember` ガードで保護する
 */
@Controller("rooms")
export class RoomsController {
  /**
   * ルームに関わる 4 つのユースケースを依存性注入で受け取る
   */
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly joinRoom: JoinRoom,
    private readonly getRoom: GetRoom,
    private readonly getMembership: GetRoomMembership,
  ) {}

  /**
   * 新規ルームを発行し ホストとして cookie セッションを立てる
   * 返り値はホストメンバーを自分自身として含む参加情報となる
   */
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateRoomRequest)) body: CreateRoomRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RoomMembership> {
    const { room, member } = await this.createRoom.execute({ hostName: body.hostName });
    response.cookie(MEMBER_COOKIE, member.id, MEMBER_COOKIE_OPTIONS);
    return { room, me: member };
  }

  /**
   * 既存ルームに参加し 新規メンバーとして cookie セッションを立てる
   * 既に当ルームの有効なメンバー cookie があれば新規作成せず既存メンバーを返す冪等動作を取る
   * 返り値は自分自身のメンバーを含む参加情報となる
   */
  @Post(":roomId/members")
  async join(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @Body(new ZodValidationPipe(JoinRoomRequest)) body: JoinRoomRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RoomMembership> {
    const existing = MemberId.safeParse(request.cookies?.[MEMBER_COOKIE]);
    const { room, member } = await this.joinRoom.execute({
      roomId,
      name: body.name,
      ...(existing.success ? { existingMemberId: existing.data } : {}),
    });
    response.cookie(MEMBER_COOKIE, member.id, MEMBER_COOKIE_OPTIONS);
    return { room, me: member };
  }

  /**
   * 現在の cookie セッションと URL から 自身が所属するルームとメンバーを復元する
   * リロード越しの自己復元用エンドポイントであり `RequireMember` ガードで保護する
   */
  @Get(":roomId/me")
  @UseGuards(RequireMember)
  async me(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() current: { id: MemberId },
  ): Promise<RoomMembership> {
    const { room, member } = await this.getMembership.execute({
      roomId,
      memberId: current.id,
    });
    return { room, me: member };
  }

  /**
   * 指定 ID のルームを公開情報として返す
   * 参加検証を伴わない単純な閲覧向けエンドポイント
   */
  @Get(":id")
  async get(@Param("id", new ZodValidationPipe(RoomId)) id: RoomId): Promise<Room> {
    return this.getRoom.execute({ id });
  }
}
