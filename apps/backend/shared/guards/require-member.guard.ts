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
 * メンバー用 cookie の有無と形式を検証し リクエストに現在のメンバー情報を詰めるガード
 * 成功時は後段の `CurrentMember` デコレータが同じ情報を取り出す
 */
@Injectable()
export class RequireMember implements CanActivate {
  /**
   * cookie から メンバー ID を解析してリクエストに添付する
   * 欠落や形式不正があれば `UnauthorizedException` を投げ コントローラに到達させない
   */
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
