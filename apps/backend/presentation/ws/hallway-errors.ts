import { HallwayErrorCode } from "@play.realtime/contracts";

/**
 * ドメイン例外を列挙コードへ引き当てる
 * ドメイン例外クラスは `this.name` にクラス名をそのまま載せる慣習になっており Contracts の `HallwayErrorCode` Zod enum がその文字列集合と一致するため enum による safeParse で派生させる
 * 引き当てに外れたときは null を返し 呼び出し側は従来の警告ログ経路に任せる
 */
export const hallwayErrorCodeOf = (error: unknown): HallwayErrorCode | null => {
  if (!(error instanceof Error)) {
    return null;
  }
  const parsed = HallwayErrorCode.safeParse(error.name);
  return parsed.success ? parsed.data : null;
};
