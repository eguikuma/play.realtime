import * as z from "zod";

/**
 * サーバ起動時に検証する環境変数スキーマ
 * 既定値を当て込むことでローカル開発の `.env` なし起動を許容しつつ、本番では明示設定を前提にする
 */
export const Environment = z.object({
  /** HTTP リッスンポート、既定 4000 */
  PORT: z.coerce.number().int().positive().default(4000),
  /** フロントエンド Origin、CORS と WebSocket Origin 検証で使う */
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  /** ルーム無人から自動閉鎖までの猶予、テストでは短縮値を渡して検証する */
  ROOM_GRACE_MS: z.coerce.number().int().positive().default(30_000),
});
export type Environment = z.infer<typeof Environment>;

/**
 * `process.env` を `Environment` スキーマでパースして検証済みオブジェクトを返す
 * 値の欠落や型不整合は即 throw でアプリ起動を止める
 */
export const load = (): Environment => Environment.parse(process.env);
