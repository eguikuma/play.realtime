import type { InvitationId } from "@play.realtime/contracts";

/**
 * 招待の自動失効タイマーを ID 別に保持するサービスの port 型
 * `InviteHallway` が 10 秒後の失効コールバックを登録し、`Accept`、`Decline`、`Cancel`、WebSocket 接続切断のいずれかで `cancel` されて発火前に停止する
 * 具体実装はインフラ層の `infrastructure/timer/` に置き、in-memory と Redis のどちらに倒すかは `STORAGE_DRIVER` 環境変数で切り替える
 */
export type HallwayInvitationTimers = {
  /**
   * 失効タイマーを登録する
   * 経過後にコールバックが呼ばれ、内部状態からも自動で削除される
   */
  register: (id: InvitationId, delayMs: number, callback: () => void) => void;
  /**
   * 稼働中のタイマーを取り消す
   * 既に発火済み、または未登録の場合は何もしない
   */
  cancel: (id: InvitationId) => void;
};

/**
 * `HallwayInvitationTimers` 型と同名の DI トークン
 * NestJS の `@Inject(HallwayInvitationTimers)` で `infrastructure/timer/module.ts` が振り分けた driver 別実装を注入するために値空間にも識別子を用意している
 */
export const HallwayInvitationTimers = "HallwayInvitationTimers" as const;
