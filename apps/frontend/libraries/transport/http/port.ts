import type { z } from "zod";

/**
 * フロントエンドからサーバを呼ぶ HTTP クライアントの port 型
 * メソッドは全て Zod schema を受け取り、戻り値を実行時検証で型安全な値まで落とし込む
 * `createNativeHttpClient` が実装を担い、テストやストーリーブックでは任意の `HttpClient` を差し替えられる
 */
export type HttpClient = {
  /** `GET {path}` でリソースを取得する、`response` schema で戻り値を検証する */
  get<TResponse>(parameters: { path: string; response: z.ZodType<TResponse> }): Promise<TResponse>;
  /**
   * `POST {path}` でボディを送信する、`request` を渡せば送信前にバリデーションする
   * サーバ側も Zod で再検証するため `request` 省略時は呼び出し側で型が合っていれば十分
   */
  post<TRequest, TResponse>(parameters: {
    path: string;
    body: TRequest;
    request?: z.ZodType<TRequest>;
    response: z.ZodType<TResponse>;
  }): Promise<TResponse>;
  /** `DELETE {path}` を呼ぶ、戻り値は返さない前提の経路で使う */
  delete(parameters: { path: string }): Promise<void>;
};
