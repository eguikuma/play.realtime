import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";

/**
 * Vibe 永続化の port 型
 * 接続単位で状態を保持しつつ、メンバー単位への集約 API も提供して SSE 配信とスナップショット取得の両方を支える
 */
export type VibeRepository = {
  /**
   * 接続単位の新しい状態を登録する、同一メンバー初の接続かを `isFirst` で返し、メンバー単位の集約後の状態も同時に返す
   * `isFirst` は `Joined` イベントの配信要否判定に使う
   */
  save: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ isFirst: boolean; aggregated: VibeStatus }>;
  /**
   * 既存接続の状態を更新する、メンバー単位の集約結果が変化したかどうかを `updated` で返す
   * `aggregated` は対象メンバーに接続が残っていない場合だけ `null` を返す
   */
  update: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ updated: boolean; aggregated: VibeStatus | null }>;
  /**
   * 接続 1 本を削除する、そのメンバー最後の接続だったかを `isLast` で返す
   * `isLast` が `true` なら呼び出し側は `Left` イベントを配信する
   */
  delete: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ) => Promise<{ isLast: boolean; aggregated: VibeStatus | null }>;
  /** ルーム内の全メンバーの集約済み状態を一覧で返す、購読開始直後の `Snapshot` 組み立てに使う */
  snapshot: (roomId: RoomId) => Promise<Vibe[]>;
  /** 指定メンバーの集約済み状態を取得する、接続が 1 本もなければ `null` を返す */
  get: (roomId: RoomId, memberId: MemberId) => Promise<VibeStatus | null>;
  /** 指定ルームに属する全接続状態を削除する、ルーム閉鎖時のクリーンアップで使う */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * `VibeRepository` 型と同名の DI トークン
 * NestJS の `@Inject(VibeRepository)` で実装を注入するために、値空間にも同名の識別子を用意している
 */
export const VibeRepository = "VibeRepository" as const;
