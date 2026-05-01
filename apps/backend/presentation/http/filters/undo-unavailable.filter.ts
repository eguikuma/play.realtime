import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoUnavailable } from "../../../domain/bgm";

/**
 * Domain Error `UndoUnavailable` を HTTP 409 へ変換する ExceptionFilter
 * 直前操作が存在しない状態で undo が呼ばれた前提違反を、競合系のエラーとして扱う
 */
@Catch(UndoUnavailable)
export class UndoUnavailableFilter implements ExceptionFilter {
  catch(exception: UndoUnavailable, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(409).json({
      code: "UndoUnavailable",
      message: exception.message,
    });
  }
}
