import type { BgmState, RoomId } from "@play.realtime/contracts";

/**
 * BGM 状態の永続化ポートを表す
 * 1 ルームあたり BGM 状態 1 件の取得と保存のみを担い ドメイン語彙は持ち込まない
 */
export type BgmRepository = {
  /**
   * 指定ルームの BGM 状態を返し 未設定ならなしを返す
   */
  get: (roomId: RoomId) => Promise<BgmState | null>;
  /**
   * 指定ルームの BGM 状態を上書き保存する
   */
  save: (roomId: RoomId, state: BgmState) => Promise<void>;
  /**
   * 指定ルームの BGM 状態を台帳から取り除く
   * 既に存在しない場合も冪等に無視する
   */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const BgmRepository = "BgmRepository" as const;
