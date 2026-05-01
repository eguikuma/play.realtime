import { HttpFailure } from "@/libraries/transport/http";

/**
 * URL 指定のルームが存在しないか、ID 書式不正のどちらかに該当するかを判定するヘルパ
 * 存在しない 404 と、`RoomId` バリデーション失敗を示す 400 を同じ missing 扱いとして UI の `notFound()` に流す
 */
export const isMissing = (failure: unknown): boolean =>
  failure instanceof HttpFailure && (failure.status === 404 || failure.status === 400);
