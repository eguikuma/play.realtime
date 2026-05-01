import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

/**
 * 外形監視用エンドポイントを束ねる NestJS モジュール
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
