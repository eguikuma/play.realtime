import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { MemberId } from "@play.realtime/contracts";
import type { Request } from "express";

export const CurrentMember = createParamDecorator(
  (_: unknown, context: ExecutionContext): { id: MemberId } => {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.member) {
      throw new UnauthorizedException("CurrentMember requires RequireMember guard");
    }
    return request.member;
  },
);
