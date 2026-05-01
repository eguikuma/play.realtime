import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 廊下トーク WebSocket の接続数をルームとメンバーの単位でカウントするサービスの port 型
 * 複数タブ接続の初回接続と最終接続の遷移だけを検知して、`CleanupHallwayOnDisconnect` の発火を最後の接続切断に限定する
 * 具体実装はインフラ層の `infrastructure/counter/` に置き、in-memory と Redis のどちらに倒すかは `STORAGE_DRIVER` 環境変数で切り替える
 */
export type HallwayConnectionCounter = {
  /**
   * 接続を 1 本追加し、そのメンバー初の接続かを `isFirst` で返す
   * Redis 実装側の `HINCRBY` は本質的に非同期のため、戻り値は `Promise` で受け取る
   */
  attach: (roomId: RoomId, memberId: MemberId) => Promise<{ isFirst: boolean }>;
  /**
   * 接続を 1 本減らし、そのメンバー最後の接続が切れたかを `isLast` で返す
   * `isLast` が `true` のときだけ呼び出し側は `CleanupHallwayOnDisconnect` を実行して、招待と通話の掃除を走らせる
   * Redis 実装側の `HINCRBY` は本質的に非同期のため、戻り値は `Promise` で受け取る
   */
  detach: (roomId: RoomId, memberId: MemberId) => Promise<{ isLast: boolean }>;
};

/**
 * `HallwayConnectionCounter` 型と同名の DI トークン
 * NestJS の `@Inject(HallwayConnectionCounter)` で `infrastructure/counter/module.ts` が振り分けた driver 別実装を注入するために値空間にも識別子を用意している
 */
export const HallwayConnectionCounter = "HallwayConnectionCounter" as const;
