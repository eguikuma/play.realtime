import { Module } from "@nestjs/common";
import { WsHeartbeat } from "./heartbeat";
import { WsHub } from "./hub";

@Module({
  providers: [WsHeartbeat, WsHub],
  exports: [WsHub],
})
export class WsModule {}
