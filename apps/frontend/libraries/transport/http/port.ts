import type { z } from "zod";

/**
 * フロントエンドからサーバを呼ぶ HTTP クライアントの port 型
 * メソッドは全て Zod schema を受け取り、戻り値を実行時検証で型安全な値まで落とし込む
 * `createNativeHttpClient` が実装を担い、テストやストーリーブックでは任意の `HttpClient` を差し替えられる
 */
export type HttpClient = {
  /**
   * `GET {endpoint}` でリソースを取得する
   * `response` schema で戻り値を検証する
   * */
  get<TResponse>(parameters: {
    endpoint: string;
    response: z.ZodType<TResponse>;
  }): Promise<TResponse>;
  /**
   * `POST {endpoint}` でボディを送信する
   * `request` を渡せば送信前にバリデーションする
   * サーバ側も Zod で再検証するため `request` 省略時は呼び出し側で型が合っていれば十分
   * `keepalive` を渡したときは `fetch` の `keepalive: true` を立て、タブ非表示遷移直前でもブラウザが背後で送信を完遂させる
   */
  post<TRequest, TResponse>(parameters: {
    endpoint: string;
    body: TRequest;
    request?: z.ZodType<TRequest>;
    response: z.ZodType<TResponse>;
    keepalive?: boolean;
  }): Promise<TResponse>;
  /** `DELETE {endpoint}` を呼ぶ、戻り値は返さない前提の経路で使う */
  delete(parameters: { endpoint: string }): Promise<void>;
};
