import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";
import { MEMBER_COOKIE } from "../../presentation/http/cookies";

/**
 * Cookie の `memberId` を検証して `request.member` に注入する Guard
 * 未設定、Zod 検証失敗のいずれも 401 として投げ、クライアントは入室フォームへの誘導を受け取る
 * 一度通った後の Controller は `CurrentMember` デコレータで `request.member` を安全に参照できる
 */
@Injectable()
export class RequireMember implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.cookies?.[MEMBER_COOKIE];
    const parsed = MemberId.safeParse(raw);
    if (!parsed.success) {
      throw new UnauthorizedException("memberId cookie is missing or invalid");
    }
    request.member = { id: parsed.data };
    return true;
  }
}
