import { Module } from "@nestjs/common";
import { SseHeartbeat } from "./heartbeat";
import { SseHub } from "./hub";

/**
 * SSE 配信経路を提供するモジュール
 * `SseHub` だけを外部へ公開し、`SseHeartbeat` は hub 内部からのみ使う非公開 provider として閉じる
 */
@Module({
  providers: [SseHeartbeat, SseHub],
  exports: [SseHub],
})
export class SseModule {}
