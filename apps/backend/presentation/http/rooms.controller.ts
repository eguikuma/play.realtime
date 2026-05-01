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

@Controller("rooms")
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly joinRoom: JoinRoom,
    private readonly getRoom: GetRoom,
    private readonly getMembership: GetRoomMembership,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateRoomRequest)) body: CreateRoomRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RoomMembership> {
    const { room, member } = await this.createRoom.execute({ hostName: body.hostName });
    response.cookie(MEMBER_COOKIE, member.id, MEMBER_COOKIE_OPTIONS);
    return { room, me: member };
  }

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

  @Get(":id")
  async get(@Param("id", new ZodValidationPipe(RoomId)) id: RoomId): Promise<Room> {
    return this.getRoom.execute({ id });
  }
}
