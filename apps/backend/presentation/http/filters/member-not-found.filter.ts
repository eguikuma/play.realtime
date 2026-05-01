import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { MemberNotFound } from "../../../domain/room";

/**
 * Domain Error `MemberNotFound` を HTTP 401 へ変換する ExceptionFilter
 * Cookie に残っている `MemberId` がルーム側で既に消えていた不整合を、認可エラーとしてクライアントの再入室フォームへ誘導する
 */
@Catch(MemberNotFound)
export class MemberNotFoundFilter implements ExceptionFilter {
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
