import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoExpired } from "../../../domain/bgm";

/**
 * `UndoExpired` を 410 の JSON 応答に変換する例外フィルタ
 * undo 窓の期限切れを Gone として区別することで UI が undo ボタンを落とす判断材料にできる
 */
@Catch(UndoExpired)
export class UndoExpiredFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: UndoExpired, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(410).json({
      code: "UndoExpired",
      message: exception.message,
    });
  }
}
