import type { Topic } from "@play.realtime/contracts";

/**
 * ルーム横断のイベントハブとして使う pub/sub の port 型
 * 現状は in-memory 実装だけを持つが、将来 Redis pub/sub に差し替えても usecase 層は書き換えなくて済むようインフラ層から独立させている
 * `publish` と `subscribe` の `topic` 引数は contracts 由来の `Topic` ブランドを要求し、機能ごとの購読経路を型で区別する
 */
export type PubSub = {
  /** 指定トピックへ `payload` を配信する、購読者がいなければ何もしない */
  publish: <T>(topic: Topic, payload: T) => Promise<void>;
  /** 指定トピックを購読し、配信ごとに `handler` を呼ぶ、戻り値の `unsubscribe` で解除する */
  subscribe: <T>(topic: Topic, handler: (payload: T) => void) => Subscription;
  /** 指定プレフィックスで始まる全トピックの購読を終わらせる、ルーム閉鎖時に該当ルームの全配信経路をまとめて閉じる */
  closeByPrefix: (prefix: string) => void;
};

/**
 * `subscribe` の戻り値、`unsubscribe` を呼ぶと当該 handler への配信が止まる
 */
export type Subscription = {
  unsubscribe: () => void;
};

/**
 * `PubSub` 型と同名の DI トークン
 * NestJS の `@Inject(PubSub)` で実装を注入するために、値空間にも同名の識別子を用意している
 */
export const PubSub = "PubSub" as const;
