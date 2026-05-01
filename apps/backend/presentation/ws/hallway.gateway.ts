import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import {
  type ConnectionId,
  HallwayAcceptRequest,
  HallwayCancelRequest,
  HallwayDeclineRequest,
  HallwayInviteRequest,
  HallwayLeaveCallRequest,
  HallwaySendMessageRequest,
  type MemberId,
  MemberId as MemberIdSchema,
  type RoomId,
  RoomId as RoomIdSchema,
} from "@play.realtime/contracts";
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

    const roomIdResult = RoomIdSchema.safeParse(match[1]);
    if (!roomIdResult.success) {
      socket.destroy();
      return;
    }

    const cookies = parseCookies(request.headers.cookie ?? "");
    const memberIdResult = MemberIdSchema.safeParse(cookies[MEMBER_COOKIE]);
    if (!memberIdResult.success) {
      socket.destroy();
      return;
    }

    try {
      await this.membership.execute({
        roomId: roomIdResult.data,
        memberId: memberIdResult.data,
      });
    } catch {
      socket.destroy();
      return;
    }

    this.wsServer.handleUpgrade(request, socket, head, (ws) => {
      this.onConnected(ws, roomIdResult.data, memberIdResult.data);
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
      onMessage: async (_attached, envelope) => {
        await this.dispatch(envelope, roomId, memberId);
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
   * 受信した包みを名前で分岐させ 各ユースケースへ橋渡しする
   * Zod 解析の失敗やユースケースの例外は 警告ログで握りつぶし 接続自体は維持する
   */
  private async dispatch(
    envelope: { name: string; data: unknown },
    roomId: RoomId,
    memberId: MemberId,
  ): Promise<void> {
    try {
      switch (envelope.name) {
        case "Invite": {
          const data = HallwayInviteRequest.parse(envelope.data);
          await this.invite.execute({
            roomId,
            inviterId: memberId,
            inviteeId: data.targetMemberId,
          });
          return;
        }
        case "Accept": {
          const data = HallwayAcceptRequest.parse(envelope.data);
          await this.accept.execute({ roomId, memberId, invitationId: data.invitationId });
          return;
        }
        case "Decline": {
          const data = HallwayDeclineRequest.parse(envelope.data);
          await this.decline.execute({ roomId, memberId, invitationId: data.invitationId });
          return;
        }
        case "Cancel": {
          const data = HallwayCancelRequest.parse(envelope.data);
          await this.cancel.execute({ roomId, memberId, invitationId: data.invitationId });
          return;
        }
        case "Send": {
          const data = HallwaySendMessageRequest.parse(envelope.data);
          await this.send.execute({ roomId, callId: data.callId, memberId, text: data.text });
          return;
        }
        case "Leave": {
          const data = HallwayLeaveCallRequest.parse(envelope.data);
          await this.leave.execute({ roomId, callId: data.callId, memberId });
          return;
        }
        default: {
          this.logger.debug(`unknown message ${envelope.name}`);
          return;
        }
      }
    } catch (error: unknown) {
      this.logger.warn(`dispatch ${envelope.name} failed ${String(error)}`);
    }
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
