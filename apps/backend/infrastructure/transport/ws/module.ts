import { Module } from "@nestjs/common";
import { WsHeartbeat } from "./heartbeat";
import { WsHub } from "./hub";

/**
 * WebSocket 配信経路を提供するモジュール
 * `WsHub` だけを外部へ公開し、`WsHeartbeat` は hub 内部からのみ使う非公開 provider として閉じる
 */
@Module({
  providers: [WsHeartbeat, WsHub],
  exports: [WsHub],
})
export class WsModule {}
