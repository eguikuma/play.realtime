import { Module } from "@nestjs/common";
import { MurmurBroadcaster } from "../../application/murmur/broadcaster";
import { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import { PostMurmur } from "../../application/murmur/post.usecase";
import { MurmurRepository } from "../../domain/murmur";
import { InMemoryMurmurRepository } from "../../infrastructure/repository/in-memory/murmur";
import { SseModule } from "../../infrastructure/transport/sse";
import { MurmursController } from "./murmurs.controller";
import { RoomsModule } from "./rooms.module";

/**
 * Murmur 機能を組み立てる Module
 * `RoomsModule` から `RoomRepository` を再利用し、`SseModule` の `SseHub` で SSE 配信経路に繋ぐ
 */
@Module({
  imports: [RoomsModule, SseModule],
  controllers: [MurmursController],
  providers: [
    PostMurmur,
    GetMurmurSnapshot,
    MurmurBroadcaster,
    {
      provide: MurmurRepository,
      useClass: InMemoryMurmurRepository,
    },
  ],
  exports: [MurmurRepository],
})
export class MurmursModule {}
