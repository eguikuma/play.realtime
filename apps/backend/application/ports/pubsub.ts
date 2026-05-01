/**
 * パブリッシュ購読の抽象ポートを表す
 * 単一サーバーの仮置き実装と 将来の Redis のパブリッシュ購読実装を差し替えられるようにこの境界を挟む
 * 発行と購読という最小の組だけを持たせ 永続化や配送保証は担わない
 */
export type PubSub = {
  publish: <T>(topic: string, payload: T) => Promise<void>;
  subscribe: <T>(topic: string, handler: (payload: T) => void) => Subscription;
};

/**
 * 購読の結果として受け取る操作ハンドル
 * 解除は何度呼んでも副作用を起こさない
 */
export type Subscription = {
  unsubscribe: () => void;
};

/**
 * NestJS の依存性注入で使うトークン
 * 型は実行時に存在しないため 同名の文字列トークンで解決する
 */
export const PubSub = "PubSub" as const;
