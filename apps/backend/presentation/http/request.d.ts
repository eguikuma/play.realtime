import type { MemberId } from "@play.realtime/contracts";

/**
 * Express の Request を拡張して `RequireMember` ガードが詰める現在のメンバー情報を型で公開する
 * 宣言の合成が必要なため interface を使う
 */
declare global {
  namespace Express {
    interface Request {
      member?: {
        id: MemberId;
      };
    }
  }
}
