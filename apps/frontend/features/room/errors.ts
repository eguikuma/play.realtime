import { HttpFailure } from "@/libraries/transport/http";

/**
 * ルームにたどり着けない状態を表す HTTP 応答の集合
 * 404 はリポジトリ上に無いルーム 400 はフォーマット違反の URL でのパス検証失敗を意味し
 * どちらもユーザーの側からすれば「このリンクでは入れない」という同じ体験となるため 1 つの判定に畳む
 */
export const isMissing = (failure: unknown): boolean =>
  failure instanceof HttpFailure && (failure.status === 404 || failure.status === 400);
