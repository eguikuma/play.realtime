import type { VibeStatus } from "@play.realtime/contracts";

/**
 * 同一メンバーの複数接続から集まった `VibeStatus` を 1 つに集約する純粋関数
 * いずれか 1 つでも `present` があれば集約結果は `present`、全てが `focused` のときのみ `focused` とする
 * 可視タブの存在を優先することで、集中モードのタブがあっても別タブで見ていれば在室中と判定する
 */
export const aggregate = (statuses: VibeStatus[]): VibeStatus => {
  return statuses.includes("present") ? "present" : "focused";
};
