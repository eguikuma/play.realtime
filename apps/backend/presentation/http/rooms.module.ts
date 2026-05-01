import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { CreateRoom } from "../../application/room/create.usecase";
import { GetRoom } from "../../application/room/get.usecase";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { JoinRoom } from "../../application/room/join.usecase";
import { RoomRepository } from "../../domain/room";
import { InMemoryRoomRepository } from "../../infrastructure/repository/in-memory/room";
import { MemberNotFoundFilter } from "./filters/member-not-found.filter";
import { RoomNotFoundFilter } from "./filters/room-not-found.filter";
import { RoomsController } from "./rooms.controller";

/**
 * ルーム機能を組み立てる Module
 * `RoomRepository` の in-memory 実装と、`RoomNotFound` と `MemberNotFound` の ExceptionFilter を `APP_FILTER` として登録する
 * `RoomRepository` と `GetRoomMembership` は他モジュールの Guard や usecase から再利用されるため export する
 */
@Module({
  controllers: [RoomsController],
  providers: [
    CreateRoom,
    GetRoom,
    GetRoomMembership,
    JoinRoom,
    {
      provide: RoomRepository,
      useClass: InMemoryRoomRepository,
    },
    {
      provide: APP_FILTER,
      useClass: RoomNotFoundFilter,
    },
    {
      provide: APP_FILTER,
      useClass: MemberNotFoundFilter,
    },
  ],
  exports: [RoomRepository, GetRoomMembership],
})
export class RoomsModule {}
