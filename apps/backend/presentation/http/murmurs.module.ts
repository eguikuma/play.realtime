import { Module } from "@nestjs/common";
import { GetMurmurSnapshot } from "../../application/murmur/get-snapshot.usecase";
import { PostMurmur } from "../../application/murmur/post.usecase";
import { MurmurRepository } from "../../domain/murmur";
import { InMemoryMurmurRepository } from "../../infrastructure/repository/in-memory/murmur";
import { SseModule } from "../../infrastructure/transport/sse";
import { MurmursController } from "./murmurs.controller";
import { RoomsModule } from "./rooms.module";

/**
 * ひとこと機能の組み立てを束ねる NestJS モジュール
 */
@Module({
  imports: [RoomsModule, SseModule],
  controllers: [MurmursController],
  providers: [
    PostMurmur,
    GetMurmurSnapshot,
    {
      provide: MurmurRepository,
      useClass: InMemoryMurmurRepository,
    },
  ],
})
export class MurmursModule {}
