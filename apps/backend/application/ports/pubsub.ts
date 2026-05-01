/**
 * パブリッシュ購読の抽象ポートを表す
 * 単一サーバーの仮置き実装と 将来の Redis のパブリッシュ購読実装を差し替えられるようにこの境界を挟む
 * 発行と購読という最小の組だけを持たせ 永続化や配送保証は担わない
 */
export type PubSub = {
  /**
   * 指定トピックにペイロードを配信する
   */
  publish: <T>(topic: string, payload: T) => Promise<void>;
  /**
   * 指定トピックに購読ハンドラを登録し 解除用のハンドルを返す
   */
  subscribe: <T>(topic: string, handler: (payload: T) => void) => Subscription;
  /**
   * 指定プレフィックスに一致するトピックの購読を全て打ち切る
   * ルーム単位の後片付けで 残留購読を一括処理するための防御策として使う
   * 既に通常の購読解除で空になっているトピックは冪等に無視する
   */
  closeByPrefix: (prefix: string) => void;
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
