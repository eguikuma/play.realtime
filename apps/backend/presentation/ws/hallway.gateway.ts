import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { type ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { type WebSocket, WebSocketServer } from "ws";
import { AcceptHallwayInvitation } from "../../application/hallway/accept-invitation.usecase";
import { CancelHallwayInvitation } from "../../application/hallway/cancel-invitation.usecase";
import { HallwayConnectionCounter } from "../../application/hallway/connection-counter";
import { DeclineHallwayInvitation } from "../../application/hallway/decline-invitation.usecase";
import { GetHallwaySnapshot } from "../../application/hallway/get-snapshot.usecase";
import { HandleHallwayDisconnect } from "../../application/hallway/handle-disconnect.usecase";
import { InviteHallway } from "../../application/hallway/invite.usecase";
import { LeaveHallwayCall } from "../../application/hallway/leave-call.usecase";
import { SendHallwayMessage } from "../../application/hallway/send-message.usecase";
import { topic } from "../../application/hallway/topic";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { RoomPresence } from "../../application/room/presence";
import { load } from "../../environment";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { WsConnection, WsHub } from "../../infrastructure/transport/ws";
import { MEMBER_COOKIE } from "../http/cookies";
import { dispatchHallwayCommand, type HallwayCommandHandlers } from "./hallway-dispatch";

/**
 * 廊下トーク用の WebSocket エンドポイントを提供するゲートウェイ
 * NestJS の抽象は使わず Express の昇格イベントを直接拾い ws ライブラリで処理する
 */
@Injectable()
export class HallwayGateway implements OnModuleInit {
  /**
   * ゲートウェイ固有の警告やデバッグログを出す NestJS のロガー
   */
  private readonly logger = new Logger(HallwayGateway.name);
  /**
   * 単一ルームに閉じない WebSocket サーバー本体 昇格を手動で取り回すため noServer を真にする
   */
  private readonly wsServer = new WebSocketServer({ noServer: true });
  /**
   * プロセス起動時の環境変数スナップショット WEB_ORIGIN の検証に使う
   */
  private readonly environment = load();
  /**
   * 受理する WebSocket のパスパターン 捕捉群の 1 番目がルーム ID となる
   */
  private readonly pathPattern = /^\/rooms\/([^/?#]+)\/hallway(?:\?.*)?$/;

  /**
   * アダプタホスト WebSocket ハブ ID 生成器 そして全ユースケースを依存性注入で受け取る
   */
  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly hub: WsHub,
    private readonly ids: NanoidIdGenerator,
    private readonly counter: HallwayConnectionCounter,
    private readonly presence: RoomPresence,
    private readonly membership: GetRoomMembership,
    private readonly getSnapshot: GetHallwaySnapshot,
    private readonly invite: InviteHallway,
    private readonly accept: AcceptHallwayInvitation,
    private readonly decline: DeclineHallwayInvitation,
    private readonly cancel: CancelHallwayInvitation,
    private readonly send: SendHallwayMessage,
    private readonly leave: LeaveHallwayCall,
    private readonly handleDisconnect: HandleHallwayDisconnect,
  ) {}

  /**
   * クライアント命令名ごとのハンドラ対応表
   * アロー関数のフィールド初期化で `this` を束縛し 各命令から対応するユースケースへ入力を橋渡しする
   */
  private readonly handlers = {
    Invite: async ({ context, data }) => {
      await this.invite.execute({
        roomId: context.roomId,
        inviterId: context.memberId,
        inviteeId: data.inviteeId,
      });
    },
    Accept: async ({ context, data }) => {
      await this.accept.execute({
        roomId: context.roomId,
        memberId: context.memberId,
        invitationId: data.invitationId,
      });
    },
    Decline: ({ context, data }) =>
      this.decline.execute({
        roomId: context.roomId,
        memberId: context.memberId,
        invitationId: data.invitationId,
      }),
    Cancel: ({ context, data }) =>
      this.cancel.execute({
        roomId: context.roomId,
        memberId: context.memberId,
        invitationId: data.invitationId,
      }),
    Send: ({ context, data }) =>
      this.send.execute({
        roomId: context.roomId,
        callId: data.callId,
        memberId: context.memberId,
        text: data.text,
      }),
    Leave: ({ context, data }) =>
      this.leave.execute({
        roomId: context.roomId,
        callId: data.callId,
        memberId: context.memberId,
      }),
  } satisfies HallwayCommandHandlers;

  /**
   * NestJS 起動時に HTTP サーバーの昇格イベントへフックを張る
   */
  onModuleInit(): void {
    const httpServer = this.adapter.httpAdapter.getHttpServer();
    httpServer.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      void this.onUpgrade(request, socket, head);
    });
  }

  /**
   * 昇格リクエストを検証し 適格なものだけ WebSocket に昇格させる
   * パス オリジン cookie 参加情報の順に確認し 不適格ならソケットを即破棄する
   */
  private async onUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const match = this.pathPattern.exec(request.url ?? "");
    if (!match) {
      socket.destroy();
      return;
    }

    if (request.headers.origin !== this.environment.WEB_ORIGIN) {
      socket.destroy();
      return;
    }

    const roomId = RoomId.safeParse(match[1]);
    if (!roomId.success) {
      socket.destroy();
      return;
    }

    const cookies = parseCookies(request.headers.cookie ?? "");
    const memberId = MemberId.safeParse(cookies[MEMBER_COOKIE]);
    if (!memberId.success) {
      socket.destroy();
      return;
    }

    try {
      await this.membership.execute({
        roomId: roomId.data,
        memberId: memberId.data,
      });
    } catch {
      socket.destroy();
      return;
    }

    this.wsServer.handleUpgrade(request, socket, head, (ws) => {
      this.onConnected(ws, roomId.data, memberId.data);
    });
  }

  /**
   * 接続成立直後の初期配信と 終了時の差し込み処理を設定する
   * 接続計数で 初回接続の追跡を始め 最終接続の切断時にだけ切断後始末のユースケースを起動する
   */
  private onConnected(ws: WebSocket, roomId: RoomId, memberId: MemberId): void {
    const connectionId = this.ids.connection() as ConnectionId;
    const connection = new WsConnection(connectionId, memberId, roomId, ws);

    this.presence.register(roomId);
    this.hub.attach(connection, {
      topic: topic(roomId, memberId),
      onAttach: async (attached) => {
        this.counter.attach(roomId, memberId);
        attached.send("Welcome", { connectionId });
        const snapshot = await this.getSnapshot.execute({ roomId });
        attached.send("Snapshot", snapshot);
      },
      onMessage: async (attached, envelope) => {
        await this.dispatch(attached, envelope, roomId, memberId);
      },
    });

    connection.onClose(() => {
      this.presence.deregister(roomId);
      const { isLast } = this.counter.detach(roomId, memberId);
      if (!isLast) {
        return;
      }
      void this.handleDisconnect.execute({ roomId, memberId }).catch((error: unknown) => {
        this.logger.warn(`handle-disconnect failed ${String(error)}`);
      });
    });
  }

  /**
   * 受信した包みを名前で分岐させ 各ハンドラへ橋渡しする
   * 分岐本体は純粋関数の `dispatchHallwayCommand` に委ね クラス側はハンドラ対応表と文脈の合成だけを担う
   */
  private dispatch(
    connection: WsConnection,
    envelope: { name: string; data: unknown },
    roomId: RoomId,
    memberId: MemberId,
  ): Promise<void> {
    return dispatchHallwayCommand({
      connection,
      envelope,
      context: { roomId, memberId },
      handlers: this.handlers,
      logger: this.logger,
    });
  }
}

/**
 * Cookie ヘッダを鍵と値のマップへ緩く展開する
 * 復号の失敗や不完全な行は静かに捨て 残りを返す
 */
const parseCookies = (header: string): Record<string, string> => {
  if (!header) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const entry of header.split(";")) {
    const [name, ...rest] = entry.trim().split("=");
    if (!name || rest.length === 0) {
      continue;
    }
    try {
      result[name] = decodeURIComponent(rest.join("="));
    } catch {}
  }
  return result;
};
