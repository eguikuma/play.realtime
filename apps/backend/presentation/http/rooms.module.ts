import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { CreateRoom } from "../../application/room/create.usecase";
import { GetRoom } from "../../application/room/get.usecase";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { JoinRoom } from "../../application/room/join.usecase";
import { MemberNotFoundFilter } from "./filters/member-not-found.filter";
import { RoomNotFoundFilter } from "./filters/room-not-found.filter";
import { RoomsController } from "./rooms.controller";

/**
 * ルーム機能を組み立てる Module
 * `RoomRepository` 実装は Global の `RepositoryModule` から注入され、ここでは usecase と Controller、ExceptionFilter のみを束ねる
 * `GetRoomMembership` は他モジュールの Guard から再利用されるため export する
 */
@Module({
  controllers: [RoomsController],
  providers: [
    CreateRoom,
    GetRoom,
    GetRoomMembership,
    JoinRoom,
    {
      provide: APP_FILTER,
      useClass: RoomNotFoundFilter,
    },
    {
      provide: APP_FILTER,
      useClass: MemberNotFoundFilter,
    },
  ],
  exports: [GetRoomMembership],
})
export class RoomsModule {}
