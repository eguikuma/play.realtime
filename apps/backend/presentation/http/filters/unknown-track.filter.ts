import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UnknownTrack } from "../../../domain/bgm";

/**
 * Domain Error `UnknownTrack` を HTTP 400 へ変換する ExceptionFilter
 * サーバ側の曲リスト改訂後に古いクライアントが未登録 ID を送ったケースを、バリデーション由来の 400 として扱う
 */
@Catch(UnknownTrack)
export class UnknownTrackFilter implements ExceptionFilter {
  catch(exception: UnknownTrack, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      code: "UnknownTrack",
      message: exception.message,
      trackId: exception.trackId,
    });
  }
}
