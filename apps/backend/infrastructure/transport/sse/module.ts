import { Module } from "@nestjs/common";
import { SseHeartbeat } from "./heartbeat";
import { SseHub } from "./hub";

/**
 * SSE 系サービスを機能側から利用可能にする NestJS モジュール
 * `SseHeartbeat` はハブの内部依存として提供のみに留め 外部へはハブだけを公開する
 */
@Module({
  providers: [SseHeartbeat, SseHub],
  exports: [SseHub],
})
export class SseModule {}
