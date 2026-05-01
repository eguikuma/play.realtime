import * as z from "zod";

/**
 * process.env を Zod で検証したあとのサーバー環境値
 * ポート番号と WEB_ORIGIN は欠落時に既定値を適用し CI や開発機でも .env なしで動かせるようにする
 */
export const Environment = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
});

export type Environment = z.infer<typeof Environment>;

/**
 * process.env を読み取って 環境値として返す
 * 呼び出し側はこの戻り値を保持しておき 以後の参照で再解析を避ける
 */
export const load = (): Environment => Environment.parse(process.env);
