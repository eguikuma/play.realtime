import * as z from "zod";

/**
 * サーバ起動時に検証する環境変数スキーマ
 * 既定値を当て込むことでローカル開発の `.env` なし起動を許容しつつ、本番では明示設定を前提にする
 */
export const Environment = z.object({
  /** HTTP リッスンポート、既定 4000 */
  PORT: z.coerce.number().int().positive().default(4000),
  /** フロントエンド Origin、CORS と WebSocket Origin 検証で使う */
  FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
  /** ルーム無人から自動閉鎖までの猶予、テストでは短縮値を渡して検証する */
  ROOM_GRACE_MS: z.coerce.number().int().positive().default(30_000),
  /**
   * メンバー Cookie の SameSite 属性
   * 同一オリジン運用は `strict`、異なるオリジン同士で送り合う場合では `none` を指定する
   */
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
  /**
   * メンバー Cookie の Secure 属性、HTTPS 配信のみで送るかどうかを真偽値で受ける
   * COOKIE_SAME_SITE=none` の場合は必ず `true` を併用する必要がある
   */
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /**
   * メンバー Cookie の Partitioned 属性、CHIPS で third-party cookie ブロック下でも保存可能にする
   * フロントエンドの top-level site で分離保存され、本サービス以外からは参照されない
   */
  COOKIE_PARTITIONED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
export type Environment = z.infer<typeof Environment>;

/**
 * `process.env` を `Environment` スキーマでパースして検証済みオブジェクトを返す
 * 値の欠落や型不整合は即 throw でアプリ起動を止める
 */
export const load = (): Environment => Environment.parse(process.env);
