import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

/**
 * `/health` 経路だけを提供する最小モジュール
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
