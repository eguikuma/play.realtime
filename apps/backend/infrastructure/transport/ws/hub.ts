import { Inject, Injectable } from "@nestjs/common";
import type { z } from "zod";
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
 * WebSocket `broadcast` の引数を contracts 由来のメッセージ辞書で束縛するための型
 * キー側は辞書キーの文字列リテラルに、値側は対応する Zod schema から推論された payload 型に狭まる
 */
type EventMap = Record<string, z.ZodType>;

/**
 * WebSocket 接続を PubSub トピックへ紐付け、双方向メッセージングを集約するサービス
 * usecase 層は `broadcast(topic, name, data)` の片方向だけ知ればよく、Ping と Pong、受信パースは hub 側に閉じ込めている
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
   * 指定トピックへ `Envelope` を配信する
   * `events` は contracts 由来のメッセージ辞書で、`name` が辞書キーに、`data` が対応 schema の推論型に縛られる
   */
  async broadcast<E extends EventMap, K extends Extract<keyof E, string>>(
    _events: E,
    topic: string,
    name: K,
    data: z.infer<E[K]>,
  ): Promise<void> {
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
