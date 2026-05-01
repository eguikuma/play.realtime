import type { z } from "zod";

import { HttpFailure } from "./errors";
import type { HttpClient } from "./port";

/**
 * native fetch を使った `HttpClient` の実装を生成するファクトリ
 * Cookie を同送するため `credentials: "include"` を固定で指定し、ローカル開発時の Cross-Origin Cookie 運用に合わせる
 * レスポンス検証失敗は同じ `HttpFailure` に載せてステータスとセットで上位へ伝播させる
 */
export const createNativeHttpClient = ({ origin }: { origin: string }): HttpClient => {
  const execute = async <T>(
    path: string,
    options: RequestInit,
    response: z.ZodType<T>,
  ): Promise<T> => {
    const result = await fetch(`${origin}${path}`, {
      credentials: "include",
      headers: { "content-type": "application/json" },
      ...options,
    });
    if (!result.ok) {
      const text = await result.text().catch(() => "");
      throw new HttpFailure(result.status, text || result.statusText);
    }
    const payload = await result.json();
    const parsed = response.safeParse(payload);
    if (!parsed.success) {
      throw new HttpFailure(result.status, "response validation failed", parsed.error);
    }
    return parsed.data;
  };

  return {
    get: ({ path, response }) => execute(path, { method: "GET" }, response),
    post: ({ path, body, request, response }) => {
      const payload = request ? request.parse(body) : body;
      return execute(path, { method: "POST", body: JSON.stringify(payload) }, response);
    },
    delete: async ({ path }) => {
      const result = await fetch(`${origin}${path}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "content-type": "application/json" },
      });
      if (!result.ok) {
        const text = await result.text().catch(() => "");
        throw new HttpFailure(result.status, text || result.statusText);
      }
    },
  };
};
