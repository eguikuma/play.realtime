import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";

/**
 * `RequireMember` ガードが Cookie 検証後に `request.member` へ詰める呼び出し元メンバーの最小情報
 * controller の `@CurrentMember()` 引数注釈と Express Request 拡張で同じ型を共有する
 */
export type CurrentMember = { id: MemberId };

/**
 * Controller 引数から `request.member` を取り出すパラメータデコレータ
 * `RequireMember` ガードが事前に Cookie を検証してセットする前提で、未設定のまま呼ばれた場合は設定ミスとして 401 を投げる
 */
export const CurrentMember = createParamDecorator(
  (_: unknown, context: ExecutionContext): CurrentMember => {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.member) {
      throw new UnauthorizedException("CurrentMember requires RequireMember guard");
    }
    return request.member;
  },
);
