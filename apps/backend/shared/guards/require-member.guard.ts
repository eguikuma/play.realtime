import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";
import { MEMBER_COOKIE } from "../../presentation/http/cookies";

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
