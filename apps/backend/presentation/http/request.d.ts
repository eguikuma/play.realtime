import type { CurrentMember } from "../../shared/decorators/current-member.decorator";

declare global {
  namespace Express {
    interface Request {
      member?: CurrentMember;
    }
  }
}
