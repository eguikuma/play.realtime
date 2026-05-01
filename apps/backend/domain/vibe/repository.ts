import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";

/**
 * 空気の永続化ポートを表す
 * メンバーごと接続ごとの状態を内部に保持し メンバー単位に集約した結果を返す
 * 初回か最後かの判定結果はルーム単位の `Joined` と `Left` イベント配信の要否判定に使う
 */
export type VibeRepository = {
  /**
   * メンバーの接続 1 本ぶんのステータスを保存し 集約後の値と メンバーの初接続かを返す
   */
  save: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ isFirst: boolean; aggregated: VibeStatus }>;
  /**
   * メンバーの接続 1 本ぶんを取り除き 集約後の値と メンバーの最終接続かを返す
   */
  delete: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ) => Promise<{ isLast: boolean; aggregated: VibeStatus | null }>;
  /**
   * ルーム内の全メンバーの集約ステータス一覧を返す
   */
  snapshot: (roomId: RoomId) => Promise<Vibe[]>;
  /**
   * 指定メンバーの集約ステータスを返し 未接続ならなしを返す
   */
  get: (roomId: RoomId, memberId: MemberId) => Promise<VibeStatus | null>;
  /**
   * 指定ルームに紐づく空気データを全て破棄する
   * 接続単位の delete とは別軸の一括破棄で ルーム生命サイクル終了時に呼ぶ
   */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const VibeRepository = "VibeRepository" as const;
