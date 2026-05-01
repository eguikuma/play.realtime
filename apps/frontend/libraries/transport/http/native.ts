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
    endpoint: string,
    options: RequestInit,
    response: z.ZodType<T>,
  ): Promise<T> => {
    const result = await fetch(`${origin}${endpoint}`, {
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
    get: ({ endpoint, response }) => execute(endpoint, { method: "GET" }, response),
    post: ({ endpoint, body, request, response, keepalive }) => {
      const payload = request ? request.parse(body) : body;
      return execute(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload),
          ...(keepalive ? { keepalive: true } : {}),
        },
        response,
      );
    },
    delete: async ({ endpoint }) => {
      const result = await fetch(`${origin}${endpoint}`, {
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
