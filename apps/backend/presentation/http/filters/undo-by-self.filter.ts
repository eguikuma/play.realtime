import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UndoBySelf } from "../../../domain/bgm";

/**
 * `UndoBySelf` を 403 の JSON 応答に変換する例外フィルタ
 * 本人による undo の禁止を 意味としての Forbidden として返す
 */
@Catch(UndoBySelf)
export class UndoBySelfFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: UndoBySelf, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(403).json({
      code: "UndoBySelf",
      message: exception.message,
      memberId: exception.memberId,
    });
  }
}
