import { Controller, Get } from "@nestjs/common";

/**
 * 死活監視向けの `/health` Controller
 * 稼働時間と現在時刻を返すだけの軽量経路で、コンテナや外形監視のリバースプロキシが参照する
 */
@Controller("health")
export class HealthController {
  @Get()
  get(): { status: "ok"; uptime: number; timestamp: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
