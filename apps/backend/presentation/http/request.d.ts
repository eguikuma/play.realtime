import type { MemberId } from "@play.realtime/contracts";

declare global {
  namespace Express {
    interface Request {
      member?: {
        id: MemberId;
      };
    }
  }
}
