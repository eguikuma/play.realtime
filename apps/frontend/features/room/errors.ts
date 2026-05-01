import { HttpFailure } from "@/libraries/transport/http";

/**
 * URL 指定のルームが存在しない / ID 書式不正のどちらかに該当するかを判定するヘルパ
 * 404 (存在しない) と 400 (`RoomId` バリデーション失敗) を同じ missing 扱いとして UI の `notFound()` に流す
 */
export const isMissing = (failure: unknown): boolean =>
  failure instanceof HttpFailure && (failure.status === 404 || failure.status === 400);
