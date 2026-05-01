import type { MemberId, RoomId } from "@play.realtime/contracts";

/**
 * Vibe 退室通知の猶予タイマーを保持するサービスの port 型
 * ブラウザリロードや瞬間的な通信途絶では SSE 接続の切断と再接続がほぼ同時に起きるため、即 `Left` 配信すると他メンバーの画面が点滅する
 * そこで退室検知時は猶予タイマーを張り、同メンバーの再入室で `cancel` されれば `Left` を送らないようにする
 * 具体実装はインフラ層の `infrastructure/timer/` に置き、in-memory と Redis のどちらに倒すかは `STORAGE_DRIVER` 環境変数で切り替える
 */
export type VibePresenceGrace = {
  /**
   * 指定メンバー宛の猶予タイマーを張る
   * 同メンバーの既存タイマーがあれば差し替える
   * 時間経過で `fire` が呼ばれ、呼ばれた側で `Left` 配信などの確定処理を行う
   */
  schedule: (roomId: RoomId, memberId: MemberId, fire: () => void | Promise<void>) => void;
  /**
   * 指定メンバーの稼働中タイマーを取り消す
   * 取り消せたかどうかを `boolean` で返す
   * 戻り値が `true` のとき、呼び出し側は「再入室だったので `Joined` ではなく `Updated` を配信する」判断に使える
   */
  cancel: (roomId: RoomId, memberId: MemberId) => boolean;
};

/**
 * `VibePresenceGrace` 型と同名の DI トークン
 * NestJS の `@Inject(VibePresenceGrace)` で `infrastructure/timer/module.ts` が振り分けた driver 別実装を注入するために値空間にも識別子を用意している
 */
export const VibePresenceGrace = "VibePresenceGrace" as const;
