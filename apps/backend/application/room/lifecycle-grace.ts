import type { RoomId } from "@play.realtime/contracts";

/**
 * ルーム閉鎖前の猶予タイマーを保持するサービスの port 型
 * `RoomLifecycle` から在室遷移 `empty` で `schedule` され、`populated` で `cancel` される
 * 猶予期間は `override` で差し替えられ、`ROOM_GRACE_MS` 環境変数で `lifecycle.module.ts` の組み立て時に設定する
 * 具体実装はインフラ層の `infrastructure/timer/` に置き、in-memory と Redis のどちらに倒すかは `STORAGE_DRIVER` 環境変数で切り替える
 */
export type RoomLifecycleGrace = {
  /**
   * 猶予期間を上書きする
   * 既定 30 秒の前提で組み立てられた挙動を変更したいとき、または短い時間でテストしたいときに呼ぶ
   */
  override: (ms: number) => void;
  /**
   * 指定ルーム宛の猶予タイマーを張る
   * 同ルームの既存タイマーがあれば差し替える
   * 時間経過で `fire` が呼ばれ、呼ばれた側で `destroy` などの確定処理を行う
   */
  schedule: (roomId: RoomId, fire: () => Promise<void>) => void;
  /**
   * 稼働中の猶予タイマーを取り消す
   * 既に発火済み、または未登録の場合は何もしない
   */
  cancel: (roomId: RoomId) => void;
};

/**
 * `RoomLifecycleGrace` 型と同名の DI トークン
 * NestJS の `@Inject(RoomLifecycleGrace)` で `infrastructure/timer/module.ts` が振り分けた driver 別実装を注入するために値空間にも識別子を用意している
 */
export const RoomLifecycleGrace = "RoomLifecycleGrace" as const;
