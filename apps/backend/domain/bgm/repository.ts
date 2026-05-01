import type { BgmState, RoomId } from "@play.realtime/contracts";

/**
 * BGM 永続化の port 型
 * 1 ルーム 1 状態で保持し、`set`、`stop`、`undo` のいずれも上書き保存で反映する
 */
export type BgmRepository = {
  /**
   * 指定ルームの現在状態を取得する
   * 未保存なら `null` を返す
   * */
  get: (roomId: RoomId) => Promise<BgmState | null>;
  /** 指定ルームの現在状態を上書き保存する */
  save: (roomId: RoomId, state: BgmState) => Promise<void>;
  /**
   * 指定ルームの永続化を削除する
   * ルーム閉鎖時のクリーンアップで使う
   *  */
  remove: (roomId: RoomId) => Promise<void>;
};

/**
 * `BgmRepository` 型と同名の DI トークン
 * NestJS の `@Inject(BgmRepository)` で実装を注入するために、値空間にも同名の識別子を用意している
 */
export const BgmRepository = "BgmRepository" as const;
