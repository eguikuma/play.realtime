import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";

/**
 * Controller 引数から `request.member` を取り出すパラメータデコレータ
 * `RequireMember` ガードが事前に Cookie を検証してセットする前提で、未設定のまま呼ばれた場合は設定ミスとして 401 を投げる
 */
export const CurrentMember = createParamDecorator(
  (_: unknown, context: ExecutionContext): { id: MemberId } => {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.member) {
      throw new UnauthorizedException("CurrentMember requires RequireMember guard");
    }
    return request.member;
  },
);
