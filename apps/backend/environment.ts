import * as z from "zod";

/**
 * サーバ起動時に検証する環境変数スキーマ
 * 既定値を当て込むことでローカル開発の `.env` なし起動を許容しつつ、本番では明示設定を前提にする
 * ファイル外には `type Environment` と DI トークン `Environment` だけ公開し、スキーマ自体は `load` 経由でしか触れないようにする
 */
const _Environment = z
  .object({
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
    /**
     * 永続化と PubSub と Presence の 3 層をどの実装で動かすかの切り替え軸
     * 既定の `memory` は単一プロセスで完結する in-memory 実装、`redis` はローカル docker compose や Upstash 経由の Redis 実装に倒す
     */
    STORAGE_DRIVER: z.enum(["memory", "redis"]).default("memory"),
    /**
     * Redis 接続 URL、`STORAGE_DRIVER=redis` のときだけ参照される
     * ローカル docker compose の場合は `redis://localhost:6379`、Upstash の場合は `rediss://default:<token>@<host>:<port>` を渡す
     */
    REDIS_URL: z.url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === "redis" && !env.REDIS_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["REDIS_URL"],
        message: "STORAGE_DRIVER=redis のときは REDIS_URL を必須にする",
      });
    }
  });
export type Environment = z.infer<typeof _Environment>;

/**
 * `Environment` 型と同名の DI トークン
 * NestJS の `@Inject(Environment)` で検証済み環境変数オブジェクトを注入するために値空間にも識別子を用意している
 */
export const Environment = "Environment" as const;

/**
 * `process.env` をスキーマでパースして検証済みオブジェクトを返す
 * 値の欠落や型不整合は即 throw でアプリ起動を止める
 */
export const load = (): Environment => _Environment.parse(process.env);
