import { Inject, Injectable } from "@nestjs/common";
import type { Topic } from "@play.realtime/contracts";
import { PubSub } from "../../../application/ports/pubsub";
import type { WsConnection } from "./connection";
import { WsHeartbeat } from "./heartbeat";

/**
 * サーバとクライアントの双方向で使う共通封筒、`name` でメッセージ種別、`data` は種別別の Zod schema で後段 parse する
 */
type Envelope = {
  name: string;
  data: unknown;
};

/**
 * WebSocket 接続を PubSub トピックへ紐付け、双方向メッセージングを集約するサービス
 * usecase 層は `HallwayBroadcaster` 経由でこの hub を呼び、`name` と `data` を contracts のメッセージ辞書で型束縛してから配信する
 * Ping と Pong、受信パースは hub 側に閉じ込めている
 */
@Injectable()
export class WsHub {
  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: WsHeartbeat,
  ) {}

  /**
   * 接続にトピック購読と Ping Pong を張り、クライアント発のメッセージを `onMessage` へ受け渡す
   * `Pong` 種別のメッセージは heartbeat 側が吸収して、usecase 側 `onMessage` には届けない
   * 切断時は購読解除と heartbeat 停止を自動で行う
   */
  attach(
    connection: WsConnection,
    options: {
      topic: Topic;
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
   * 指定トピックへ `Envelope` を配信する
   * 直接呼ぶことは想定しておらず、`HallwayBroadcaster` が contracts のメッセージ辞書で型束縛した上で呼び出す
   */
  async broadcast<T>(topic: Topic, name: string, data: T): Promise<void> {
    const envelope: Envelope = { name, data };
    await this.pubsub.publish(topic, envelope);
  }
}

/**
 * 受信文字列を `Envelope` 形状に緩くパースする
 * JSON パース失敗、オブジェクトでない、`name` が `string` でないいずれかで `null` を返し、不正フレームを usecase に届けない
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
