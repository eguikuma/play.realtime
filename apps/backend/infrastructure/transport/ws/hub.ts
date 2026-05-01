import { Inject, Injectable } from "@nestjs/common";
import { PubSub } from "../../../application/ports/pubsub";
import type { WsConnection } from "./connection";
import { WsHeartbeat } from "./heartbeat";

/**
 * WebSocket の通信路で連続的に流すメッセージ 1 件ぶんの包み
 */
type Envelope = {
  name: string;
  data: unknown;
};

/**
 * WebSocket 接続とパブリッシュ購読を繋ぐサービス
 * 接続開始時にトピック購読と心拍を起動し 配信で全購読者に届ける
 */
@Injectable()
export class WsHub {
  /**
   * パブリッシュ購読ポートと心拍サービスを依存性注入で受け取る
   */
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: WsHeartbeat,
  ) {}

  /**
   * WebSocket 接続に トピック購読 心拍 メッセージ振り分けを結び付ける
   * ポン受信は心拍のコールバックで捕捉し それ以外の包みは受信ハンドラへ委譲する
   */
  attach(
    connection: WsConnection,
    options: {
      topic: string;
      onAttach?: (connection: WsConnection) => void | Promise<void>;
      onMessage?: (connection: WsConnection, envelope: Envelope) => void | Promise<void>;
    },
  ): void {
    const { stop: stopHeartbeat, onPong } = this.heartbeat.start(connection);

    const subscription = this.pubsub.subscribe<Envelope>(options.topic, (envelope) => {
      connection.send(envelope.name, envelope.data);
    });

    connection.onMessage((raw) => {
      const envelope = parse(raw);
      if (!envelope) {
        return;
      }
      if (envelope.name === "Pong") {
        onPong();
        return;
      }
      void options.onMessage?.(connection, envelope);
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
  async broadcast<T>(topic: string, name: string, data: T): Promise<void> {
    const envelope: Envelope = { name, data };
    await this.pubsub.publish(topic, envelope);
  }
}

/**
 * 通信路から受け取った生の JSON 文字列を 包みに緩く変換する
 * 名前の値が文字列でない不正なフレームは なしを返して上位で無視できるようにする
 */
const parse = (raw: string): Envelope | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("name" in parsed) ||
      typeof (parsed as { name: unknown }).name !== "string"
    ) {
      return null;
    }
    const value = parsed as { name: string; data?: unknown };
    return { name: value.name, data: value.data };
  } catch {
    return null;
  }
};
