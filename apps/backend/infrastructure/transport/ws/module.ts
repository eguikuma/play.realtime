import { Module } from "@nestjs/common";
import { WsHeartbeat } from "./heartbeat";
import { WsHub } from "./hub";

/**
 * WebSocket 系サービスを機能側から利用可能にする NestJS モジュール
 * `WsHeartbeat` はハブの内部依存として提供のみに留め 外部へはハブだけを公開する
 */
@Module({
  providers: [WsHeartbeat, WsHub],
  exports: [WsHub],
})
export class WsModule {}
