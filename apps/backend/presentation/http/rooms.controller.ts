import { Body, Controller, Get, HttpCode, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
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
import { LeaveRoom } from "../../application/room/leave.usecase";
import { CurrentMember } from "../../shared/decorators/current-member.decorator";
import { RequireMember } from "../../shared/guards/require-member.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { MEMBER_COOKIE, MEMBER_COOKIE_OPTIONS } from "./cookies";

/**
 * `/rooms` 直下のルーム作成、参加、取得、自分情報取得を束ねる Controller
 * 作成と参加では `MemberId` を Cookie に書き込み、以降の HTTP 経路が Cookie から呼び出し元を特定できるようにする
 */
@Controller("rooms")
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly joinRoom: JoinRoom,
    private readonly getRoom: GetRoom,
    private readonly getMembership: GetRoomMembership,
    private readonly leaveRoom: LeaveRoom,
  ) {}

  /**
   * `POST /rooms` ホスト名だけでルームを新規作成し、発行した `MemberId` を Cookie に書き込んで `RoomMembership` を返す
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
   * `POST /rooms/{roomId}/members` 既存ルームへ参加する、Cookie に残る `MemberId` を再入室候補として usecase へ渡してリロード時に同じメンバーへ寄せる
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
   * `GET /rooms/{roomId}/me` Cookie の `MemberId` からルーム全景と自分のメンバー情報を返す
   * `RequireMember` ガードが Cookie 未設定の場合に 401 を返し、クライアントの入室フォームへ誘導する
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
   * `GET /rooms/{id}` 認証なしでルーム存在確認に使う最小経路
   */
  @Get(":id")
  async get(@Param("id", new ZodValidationPipe(RoomId)) id: RoomId): Promise<Room> {
    return this.getRoom.execute({ id });
  }

  /**
   * `POST /rooms/{roomId}/leave` ブラウザの `pagehide` から `navigator.sendBeacon` で叩かれる明示退出シグナル
   * iOS Safari のタブ swipe-away で TCP `close` が発火しないケースを補うため、当該メンバーの SSE と WebSocket 接続を強制クローズして幽霊メンバー化を防ぐ
   * sendBeacon はレスポンス body を待たないので 204 で即時返す
   */
  @Post(":roomId/leave")
  @HttpCode(204)
  @UseGuards(RequireMember)
  async leave(
    @Param("roomId", new ZodValidationPipe(RoomId)) roomId: RoomId,
    @CurrentMember() current: { id: MemberId },
  ): Promise<void> {
    await this.leaveRoom.execute({ roomId, memberId: current.id });
  }
}
