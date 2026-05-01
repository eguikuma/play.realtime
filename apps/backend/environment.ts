import * as z from "zod";

/**
 * process.env を Zod で検証したあとのサーバー環境値
 */
export const Environment = z.object({
  /**
   * サーバーの待ち受けポート番号
   */
  PORT: z.coerce.number().int().positive().default(4000),
  /**
   * フロントエンドのオリジン
   */
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  /**
   * 最終接続断から削除までの猶予
   */
  ROOM_GRACE_MS: z.coerce.number().int().positive().default(30_000),
});

export type Environment = z.infer<typeof Environment>;

/**
 * process.env を読み取って 環境値として返す
 * 呼び出し側はこの戻り値を保持しておき 以後の参照で再解析を避ける
 */
export const load = (): Environment => Environment.parse(process.env);
