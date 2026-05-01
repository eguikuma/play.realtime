import type { RoomId } from "@play.realtime/contracts";

/**
 * ルームの在室有無が切り替わった遷移の種類
 * `empty` は最後の接続が切れて無人になった瞬間、`populated` は無人から再度在室した瞬間を表す
 */
export type PresenceTransition = "empty" | "populated";

/**
 * ルームの在室遷移を受け取るリスナー関数、`RoomLifecycle` が主要な購読者として登録する
 */
export type PresenceListener = (event: { roomId: RoomId; kind: PresenceTransition }) => void;

/**
 * `onTransition` の戻り値、`unsubscribe` を呼ぶと当該リスナーへの配信が止まる
 */
export type PresenceSubscription = {
  unsubscribe: () => void;
};

/**
 * ルームごとの現在接続数をカウントして、`empty` と `populated` の遷移をリスナーへ通知するサービスの port 型
 * `register` と `deregister` は SSE と WebSocket の両方の transport 層から呼ばれ、`onTransition` の購読者は `RoomLifecycle` を主とする
 * 具体実装はインフラ層の `infrastructure/presence/` に置き、in-memory と Redis のどちらに倒すかは `STORAGE_DRIVER` 環境変数で切り替える
 */
export type RoomPresence = {
  /** 新しい接続を記録し、無人からの復帰ならリスナーへ `populated` を配信する */
  register: (roomId: RoomId) => void;
  /** 接続を 1 本減らし、最後の接続が切れたらリスナーへ `empty` を配信する、二重解除は無視する */
  deregister: (roomId: RoomId) => void;
  /** 現在のルーム接続数を取得する、テストと診断用途が主 */
  countConnections: (roomId: RoomId) => Promise<number>;
  /** 在室遷移リスナーを登録する、戻り値の `unsubscribe` で解除する */
  onTransition: (listener: PresenceListener) => PresenceSubscription;
};

/**
 * `RoomPresence` 型と同名の DI トークン
 * NestJS の `@Inject(RoomPresence)` で `infrastructure/presence/module.ts` が振り分けた driver 別実装を注入するために値空間にも識別子を用意している
 */
export const RoomPresence = "RoomPresence" as const;
