import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { RoomNotFound } from "../../../domain/room";

/**
 * `RoomNotFound` を 404 の JSON 応答に変換する例外フィルタ
 * URL の直接入力や 破棄済みルームへのアクセスを統一した形式でクライアントへ返す
 */
@Catch(RoomNotFound)
export class RoomNotFoundFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: RoomNotFound, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(404).json({
      code: "RoomNotFound",
      message: exception.message,
      id: exception.id,
    });
  }
}
