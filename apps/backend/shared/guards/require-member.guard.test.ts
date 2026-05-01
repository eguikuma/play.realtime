import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { MEMBER_COOKIE } from "../../presentation/http/cookies";
import { RequireMember } from "./require-member.guard";

const buildContext = (request: {
  cookies?: Record<string, string>;
  member?: { id: string };
}): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe("RequireMember", () => {
  it("cookie が無いリクエストは拒否する", () => {
    const guard = new RequireMember();
    const context = buildContext({ cookies: {} });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("空の cookie 値は拒否する", () => {
    const guard = new RequireMember();
    const context = buildContext({ cookies: { [MEMBER_COOKIE]: "" } });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("有効な cookie があればリクエストにメンバーを注入して通過する", () => {
    const guard = new RequireMember();
    const request: { cookies: Record<string, string>; member?: { id: string } } = {
      cookies: { [MEMBER_COOKIE]: "member-alice" },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.member?.id).toBe("member-alice");
  });
});
