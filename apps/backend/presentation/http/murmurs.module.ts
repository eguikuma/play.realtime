import { Module } from "@nestjs/common";
import { MurmurBroadcaster } from "../../application/murmur/broadcaster";
import { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import { PostMurmur } from "../../application/murmur/post.usecase";
import { SseModule } from "../../infrastructure/transport/sse";
import { MurmursController } from "./murmurs.controller";
import { RoomsModule } from "./rooms.module";

/**
 * Murmur 機能を組み立てる Module
 * `RoomsModule` から `GetRoomMembership` を、`SseModule` から SSE 配信経路を取り込む
 * `MurmurRepository` 実装は Global の `RepositoryModule` から注入される
 */
@Module({
  imports: [RoomsModule, SseModule],
  controllers: [MurmursController],
  providers: [PostMurmur, GetMurmurSnapshot, MurmurBroadcaster],
})
export class MurmursModule {}
