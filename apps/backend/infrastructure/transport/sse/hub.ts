import { Inject, Injectable } from "@nestjs/common";
import type { Topic } from "@play.realtime/contracts";
import { PubSub } from "../../../application/ports/pubsub";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";

/**
 * PubSub を経由して SSE クライアントへ配信するイベント 1 件の内部形式
 * `name` は SSE の `event` 行、`id` は `Last-Event-ID` の再送起点に対応する
 */
type Envelope = {
  name: string;
  data: unknown;
  id?: string;
};

/**
 * SSE 接続を PubSub トピックへ紐付け、クライアントへの emit を集約するサービス
 * usecase 層は feature 別の broadcaster (`VibeBroadcaster` 等) 経由でこの hub を呼び、`name` と `data` を contracts のイベント辞書で型束縛してから配信する
 * 接続単位の購読管理と heartbeat は hub 側に閉じ込めている
 */
@Injectable()
export class SseHub {
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: SseHeartbeat,
  ) {}

  /**
   * 接続を開いてトピックを購読し、heartbeat を開始する
   * `onAttach` は購読成立直後に 1 度だけ呼ばれる、`Welcome` や初回 `Snapshot` の送出に使う
   * 接続切断時は購読解除と heartbeat 停止を自動で行う
   */
  attach(
    connection: SseConnection,
    options: {
      topic: Topic;
      onAttach?: (connection: SseConnection) => void | Promise<void>;
    },
  ): void {
    connection.open();

    const stopHeartbeat = this.heartbeat.start(connection);
    const subscription = this.pubsub.subscribe<Envelope>(options.topic, (envelope) => {
      connection.emit(envelope.name, envelope.data, envelope.id);
    });

    connection.onClose(() => {
      subscription.unsubscribe();
      stopHeartbeat();
    });

    void options.onAttach?.(connection);
  }

  /**
   * 指定トピックへ `Envelope` を配信する、`id` は省略時 undefined を保持しない形でシリアライズする
   * 直接呼ぶことは想定しておらず、feature 別 broadcaster が contracts のイベント辞書で型束縛した上で呼び出す
   */
  async broadcast<T>(topic: Topic, name: string, data: T, id?: string): Promise<void> {
    const envelope: Envelope = { name, data, ...(id !== undefined ? { id } : {}) };
    await this.pubsub.publish(topic, envelope);
  }
}
