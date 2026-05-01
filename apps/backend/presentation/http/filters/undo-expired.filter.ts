import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoExpired } from "../../../domain/bgm";

/**
 * Domain Error `UndoExpired` を HTTP 410 へ変換する ExceptionFilter
 * undo 窓が時間切れで閉じた状態を、リソース失効 410 Gone としてクライアントに伝える
 */
@Catch(UndoExpired)
export class UndoExpiredFilter implements ExceptionFilter {
  catch(exception: UndoExpired, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(410).json({
      code: "UndoExpired",
      message: exception.message,
    });
  }
}
