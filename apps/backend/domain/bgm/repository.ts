import type { BgmState, RoomId } from "@play.realtime/contracts";

/**
 * BGM 状態の永続化ポートを表す
 * 1 ルームあたり BGM 状態 1 件の取得と保存のみを担い ドメイン語彙は持ち込まない
 */
export type BgmRepository = {
  get: (roomId: RoomId) => Promise<BgmState | null>;
  save: (roomId: RoomId, state: BgmState) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const BgmRepository = "BgmRepository" as const;
