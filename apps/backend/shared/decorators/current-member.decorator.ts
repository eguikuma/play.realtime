import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";

/**
 * `RequireMember` ガードが詰めた現在のメンバー情報を コントローラ引数として取り出すデコレータ
 * ガードを通していないエンドポイントで使うと `UnauthorizedException` を投げ 結線忘れを検知する
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
