import { Module } from "@nestjs/common";
import { SseHeartbeat } from "./heartbeat";
import { SseHub } from "./hub";

@Module({
  providers: [SseHeartbeat, SseHub],
  exports: [SseHub],
})
export class SseModule {}
