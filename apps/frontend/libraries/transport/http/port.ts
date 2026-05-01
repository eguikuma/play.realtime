import type { z } from "zod";

/**
 * HTTP 通信の抽象ポートを表す
 * 将来の fetch 置換 (axios / ky など) を機能層に波及させないために このポートを挟む
 * 各メソッドは Zod スキーマと本文を引数として受け取り 応答は必ずスキーマで再検証する
 */
export type HttpClient = {
  get<TResponse>(parameters: { path: string; response: z.ZodType<TResponse> }): Promise<TResponse>;
  post<TRequest, TResponse>(parameters: {
    path: string;
    body: TRequest;
    request?: z.ZodType<TRequest>;
    response: z.ZodType<TResponse>;
  }): Promise<TResponse>;
  delete(parameters: { path: string }): Promise<void>;
};
