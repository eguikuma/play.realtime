import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";

/**
 * 空気の永続化ポートを表す
 * メンバーごと接続ごとの状態を内部に保持し メンバー単位に集約した結果を返す
 * 初回か最後かの判定結果はルーム単位の `Joined` と `Left` イベント配信の要否判定に使う
 */
export type VibeRepository = {
  save: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ isFirst: boolean; aggregated: VibeStatus }>;
  delete: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ) => Promise<{ isLast: boolean; aggregated: VibeStatus | null }>;
  snapshot: (roomId: RoomId) => Promise<Vibe[]>;
  get: (roomId: RoomId, memberId: MemberId) => Promise<VibeStatus | null>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const VibeRepository = "VibeRepository" as const;
