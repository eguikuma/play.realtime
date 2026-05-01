import type { Room, RoomId } from "@play.realtime/contracts";

/**
 * ルーム永続化の port 型
 * ドメイン層は永続化手段を知らず、具体の InMemory 実装や将来の Redis 実装はインフラ層に置く
 */
export type RoomRepository = {
  /** ルーム 1 件を新規作成または上書き保存する */
  save: (room: Room) => Promise<void>;
  /** 指定 ID のルームを取得する、存在しなければ `null` を返す */
  find: (id: RoomId) => Promise<Room | null>;
  /** 指定 ID のルームを永続化から削除する、存在しない場合は何もしない */
  remove: (id: RoomId) => Promise<void>;
};

/**
 * `RoomRepository` 型と同名の DI トークン
 * NestJS が symbol / string を許容するため値空間でも同名を使って `@Inject(RoomRepository)` で注入できるようにしている
 */
export const RoomRepository = "RoomRepository" as const;
