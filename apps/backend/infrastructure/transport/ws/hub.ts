import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import {
  type MemberId,
  MemberLeftPayload,
  type RoomId,
  type Topic,
} from "@play.realtime/contracts";
import { WsCloseCode } from "@play.realtime/transport-protocol";
import { PubSub } from "../../../application/shared/ports/pubsub";
import { GlobalTopic } from "../../../application/shared/topic";
import type { WsConnection, WsEnvelope } from "./connection";
import { WsHeartbeat } from "./heartbeat";

/**
 * WebSocket 接続を PubSub トピックへ紐付け、双方向メッセージングを集約するサービス
 * usecase 層は `HallwayBroadcaster` 経由でこの hub を呼び、`name` と `data` を contracts のメッセージ辞書で型束縛してから配信する
 * Ping と Pong、受信パースは hub 側に閉じ込めている
 * `closeByMember` は `pagehide` 起点の明示退出シグナルで、自インスタンスが保持する当該メンバーの WebSocket 接続を `GoingAway` で閉じる
 */
@Injectable()
export class WsHub implements OnModuleInit {
  private readonly connections = new Set<WsConnection>();

  constructor(
    @Inject(PubSub) private readonly pubsub: PubSub,
    private readonly heartbeat: WsHeartbeat,
  ) {}

  /**
   * 起動時に `room:member-leave` トピックを購読し、配信されたメンバーの WebSocket 接続を強制クローズする
   * 配信元は `LeaveRoom` usecase の publish、購読は Hub 単位の 1 本のみ持つので gateway での重複購読は不要
   */
  onModuleInit(): void {
    this.pubsub.subscribe<unknown>(GlobalTopic.MemberLeft, (raw) => {
      const parsed = MemberLeftPayload.safeParse(raw);
      if (!parsed.success) {
        return;
      }
      this.closeByMember(parsed.data.roomId, parsed.data.memberId);
    });
  }

  /**
   * 接続に複数トピック購読と Ping Pong を張り、クライアント発のメッセージを `onMessage` へ受け渡す
   * `topics` で渡したトピック全件に対して個別に subscription を持ち、いずれかのトピック宛配信を購読中の接続に転送する
   * `Pong` 種別のメッセージは heartbeat 側が吸収して、usecase 側 `onMessage` には届けない
   * 切断時は全 subscription の解除と heartbeat 停止、自インスタンスの追跡集合からの除去を自動で行う
   */
  attach(
    connection: WsConnection,
    options: {
      topics: readonly Topic[];
      onAttach?: (connection: WsConnection) => void | Promise<void>;
      onMessage?: (connection: WsConnection, envelope: WsEnvelope) => void | Promise<void>;
    },
  ): void {
    this.connections.add(connection);
    const { stop: stopHeartbeat, onPong } = this.heartbeat.start(connection);

    const subscriptions = options.topics.map((each) =>
      this.pubsub.subscribe<WsEnvelope>(each, (envelope) => {
        connection.send(envelope.name, envelope.data);
      }),
    );

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
      this.connections.delete(connection);
      for (const subscription of subscriptions) {
        subscription.unsubscribe();
      }
      stopHeartbeat();
    });

    void options.onAttach?.(connection);
  }

  /**
   * 指定トピックへ `WsEnvelope` を配信する
   * 直接呼ぶことは想定しておらず、`HallwayBroadcaster` が contracts のメッセージ辞書で型束縛した上で呼び出す
   */
  async broadcast<T>(topic: Topic, name: string, data: T): Promise<void> {
    const envelope: WsEnvelope = { name, data };
    await this.pubsub.publish(topic, envelope);
  }

  /**
   * 自インスタンスが保持する `roomId` 配下の `memberId` の WebSocket 接続をすべて `GoingAway` で閉じる
   * 各接続の `close()` 呼び出しは内部で冪等、close ハンドラ経由で `RoomPresence.deregister` と `HallwayConnectionCounter.detach` 等の通常切断パスを踏ませる
   */
  closeByMember(roomId: RoomId, memberId: MemberId): void {
    for (const connection of this.connections) {
      if (connection.roomId === roomId && connection.memberId === memberId) {
        connection.close(WsCloseCode.GoingAway);
      }
    }
  }
}

/**
 * 受信文字列を `WsEnvelope` 形状に緩くパースする
 * JSON パース失敗、オブジェクトでない、`name` が `string` でないいずれかで `null` を返し、不正フレームを usecase に届けない
 */
const parse = (raw: string): WsEnvelope | null => {
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
