import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoUnavailable } from "../../../domain/bgm";

/**
 * `UndoUnavailable` を 409 の JSON 応答に変換する例外フィルタ
 * undo 窓が開いていない状況を Conflict として UI 側へ伝える
 */
@Catch(UndoUnavailable)
export class UndoUnavailableFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: UndoUnavailable, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(409).json({
      code: "UndoUnavailable",
      message: exception.message,
    });
  }
}
