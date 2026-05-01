import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { UnknownTrack } from "../../../domain/bgm";

/**
 * `UnknownTrack` を 400 の JSON 応答に変換する例外フィルタ
 * 不明な楽曲識別子を Bad Request として返し クライアント側のリクエスト不整合として扱わせる
 */
@Catch(UnknownTrack)
export class UnknownTrackFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: UnknownTrack, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      code: "UnknownTrack",
      message: exception.message,
      trackId: exception.trackId,
    });
  }
}
