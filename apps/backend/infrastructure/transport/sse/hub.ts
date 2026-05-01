import { Inject, Injectable } from "@nestjs/common";
import { PubSub } from "../../../application/ports/pubsub";
import type { SseConnection } from "./connection";
import { SseHeartbeat } from "./heartbeat";

/**
 * SSE の通信路で連続的に流すイベント 1 件ぶんの包み
 * 識別子は任意であり SSE の Last-Event-Id 連携が必要なイベントにだけ設定する
 */
type Envelope = {
  name: string;
  data: unknown;
  id?: string;
};

/**
 * SSE 接続とパブリッシュ購読を繋ぐサービス
 * 接続開始時にトピック購読と心拍を立ち上げ 配信で全購読者に届ける
 */
@Injectable()
export class SseHub {
  /**
   * パブリッシュ購読ポートと心拍サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: SseHeartbeat,
  ) {}

  /**
   * SSE 接続を開いてトピック購読と心拍を起動する
   * 差し込み処理ではスナップショットなどの直送を呼び出し側が別途行う
   */
  attach(
    connection: SseConnection,
    options: {
      topic: string;
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
   * 指定トピックへ包みを発行し 全購読者へ同じ内容を届ける
   */
  async broadcast<T>(topic: string, name: string, data: T, id?: string): Promise<void> {
    const envelope: Envelope = { name, data, ...(id !== undefined ? { id } : {}) };
    await this.pubsub.publish(topic, envelope);
  }
}
