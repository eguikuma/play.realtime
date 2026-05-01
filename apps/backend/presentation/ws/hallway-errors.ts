import { HallwayErrorCode } from "@play.realtime/contracts";

/**
 * Domain Error の `name` フィールドから `HallwayErrorCode` の値を引き当てるヘルパ
 * 一致しない、または `Error` インスタンスでない場合は `null` を返し、CommandFailed に乗らない通常の例外と区別する
 * Domain Error クラス名が `HallwayErrorCode` enum と同じ文字列に揃っていることが前提の慣習的な引き当て
 */
export const hallwayErrorCodeOf = (error: unknown): HallwayErrorCode | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const parsed = HallwayErrorCode.safeParse(error.name);
  return parsed.success ? parsed.data : null;
};
