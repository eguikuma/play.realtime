import type { VibeStatus } from "@play.realtime/contracts";

/**
 * 同じメンバーが持つ複数の接続を 1 つの空気に集約する
 * どれか 1 本でも在室中を返していれば在室中とみなし 作業中は全接続が作業中のときだけ採用する
 * 「何かしている」状態を上位に置くことで 仕事中の見え方を優先する
 */
export const aggregate = (statuses: VibeStatus[]): VibeStatus => {
  return statuses.includes("present") ? "present" : "focused";
};
