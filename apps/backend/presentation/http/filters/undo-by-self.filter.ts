import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoBySelf } from "../../../domain/bgm";

/**
 * Domain Error `UndoBySelf` を HTTP 403 へ変換する ExceptionFilter
 * 操作者本人が自分の操作を undo しようとした前提違反を、権限エラーとしてクライアントに返す
 */
@Catch(UndoBySelf)
export class UndoBySelfFilter implements ExceptionFilter {
  catch(exception: UndoBySelf, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(403).json({
      code: "UndoBySelf",
      message: exception.message,
      memberId: exception.memberId,
    });
  }
}
