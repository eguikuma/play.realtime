import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { MemberNotFound } from "../../../domain/room";

/**
 * `MemberNotFound` を 401 の JSON 応答に変換する例外フィルタ
 * ルームは存在するが cookie のメンバーが該当ルームに居ないという認証文脈の食い違いを表し
 * 404 に畳まないことで フロントは入室フォーム経路にフォールバックできる
 * クライアントはコード値で事象を機械的に判別できる
 */
@Catch(MemberNotFound)
export class MemberNotFoundFilter implements ExceptionFilter {
  /**
   * 発生した例外を対応する HTTP ステータスと JSON 本文に変換する
   */
  catch(exception: MemberNotFound, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(401).json({
      code: "MemberNotFound",
      message: exception.message,
      roomId: exception.roomId,
      memberId: exception.memberId,
    });
  }
}
