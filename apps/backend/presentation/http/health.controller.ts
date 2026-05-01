import { Controller, Get } from "@nestjs/common";

/**
 * サーバー稼働状況を外形監視に向けて返すコントローラ
 * 稼働時間と時刻を添えて「プロセスが生きている」以上の情報を返す
 */
@Controller("health")
export class HealthController {
  /**
   * 稼働状況とプロセスの稼働時間を返す
   */
  @Get()
  get(): { status: "ok"; uptime: number; timestamp: string } {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
