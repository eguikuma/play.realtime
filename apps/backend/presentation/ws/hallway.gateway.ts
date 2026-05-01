import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { MemberId, RoomId } from "@play.realtime/contracts";
import { type WebSocket, WebSocketServer } from "ws";
import { AcceptHallwayInvitation } from "../../application/hallway/accept-invitation.usecase";
import { CancelHallwayInvitation } from "../../application/hallway/cancel-invitation.usecase";
import { CleanupHallwayOnDisconnect } from "../../application/hallway/cleanup-on-disconnect.usecase";
import { HallwayConnectionCounter } from "../../application/hallway/connection-counter";
import { DeclineHallwayInvitation } from "../../application/hallway/decline-invitation.usecase";
import { GetHallwaySnapshot } from "../../application/hallway/get-snapshot.usecase";
import { InviteHallway } from "../../application/hallway/invite.usecase";
import { LeaveHallwayCall } from "../../application/hallway/leave-call.usecase";
import { SendHallwayMessage } from "../../application/hallway/send-message.usecase";
import { Topic } from "../../application/hallway/topic";
import { GetRoomMembership } from "../../application/room/get-membership.usecase";
import { RoomPresence } from "../../application/room/presence";
import { load } from "../../environment";
import { NanoidIdGenerator } from "../../infrastructure/id/nanoid";
import { WsConnection, type WsEnvelope, WsHub } from "../../infrastructure/transport/ws";
import { MEMBER_COOKIE } from "../http/cookies";
import { dispatchHallwayCommand, type HallwayCommandHandlers } from "./hallway-dispatch";

/**
 * 廊下トーク WebSocket の入り口を担う Gateway
 * HTTP サーバの `upgrade` を横取りして URL パターンと Origin と Cookie の三段認可を行い、通過したら `WsConnection` を組み立てて `WsHub` に預ける
 * 接続単位の生涯は `RoomPresence` と `HallwayConnectionCounter` で二重に追い、最後の接続が切れたときだけ `CleanupHallwayOnDisconnect` を走らせる
 */
@Injectable()
export class HallwayGateway implements OnModuleInit {
  private readonly logger = new Logger(HallwayGateway.name);
  private readonly wsServer = new WebSocketServer({ noServer: true });
  private readonly environment = load();
  private readonly endpointPattern = /^\/rooms\/([^/?#]+)\/hallway(?:\?.*)?$/;

  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly hub: WsHub,
    private readonly ids: NanoidIdGenerator,
    @Inject(HallwayConnectionCounter) private readonly counter: HallwayConnectionCounter,
    @Inject(RoomPresence) private readonly presence: RoomPresence,
    private readonly membership: GetRoomMembership,
    private readonly getSnapshot: GetHallwaySnapshot,
    private readonly invite: InviteHallway,
    private readonly accept: AcceptHallwayInvitation,
    private readonly decline: DeclineHallwayInvitation,
    private readonly cancel: CancelHallwayInvitation,
    private readonly send: SendHallwayMessage,
    private readonly leave: LeaveHallwayCall,
    private readonly cleanupOnDisconnect: CleanupHallwayOnDisconnect,
  ) {}

  /**
   * `HallwayCommandName` 全件に対応するコマンドハンドラ束
   * `satisfies HallwayCommandHandlers` で網羅性を担保し、コマンド追加時に実装漏れを型検査で検出できる
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
   * Nest 起動後に HTTP サーバの `upgrade` イベントへ直接フックする
   * NestJS の `@WebSocketGateway` や Socket.io アダプタは使わず、生の `ws` ライブラリで学習目的の実装を保つ
   */
  onModuleInit(): void {
    const httpServer = this.adapter.httpAdapter.getHttpServer();
    httpServer.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      void this.onUpgrade(request, socket, head);
    });
  }

  /**
   * upgrade リクエストの認可を 4 段で実施する
   * URL が `/rooms/{roomId}/hallway` に一致、Origin が `FRONTEND_ORIGIN` と一致、Cookie の `MemberId` が妥当、ルーム内にそのメンバーが存在、の順で検証する
   * どこかで落ちれば `socket.destroy` でハンドシェイクを閉じ、それ以上のレスポンスは返さない
   */
  private async onUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const match = this.endpointPattern.exec(request.url ?? "");
    if (!match) {
      socket.destroy();
      return;
    }

    if (request.headers.origin !== this.environment.FRONTEND_ORIGIN) {
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
   * 接続成立後のライフサイクルを張る
   * `onAttach` で `Welcome` と `Snapshot` を送って初期状態を揃え、`onMessage` で受信 envelope をディスパッチへ流す
   * WebSocket 接続切断時は `RoomPresence.deregister` と `HallwayConnectionCounter.detach` の両方を呼び、そのメンバー最後の接続だった場合だけ `CleanupHallwayOnDisconnect` を走らせる
   */
  private onConnected(ws: WebSocket, roomId: RoomId, memberId: MemberId): void {
    const connectionId = this.ids.connection();
    const connection = new WsConnection(connectionId, memberId, roomId, ws);

    this.presence.register(roomId);
    this.hub.attach(connection, {
      topics: [Topic.room(roomId), Topic.message(roomId, memberId)],
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
      void this.cleanupOnDisconnect.execute({ roomId, memberId }).catch((error: unknown) => {
        this.logger.warn(`cleanup-on-disconnect failed ${String(error)}`);
      });
    });
  }

  private dispatch(
    connection: WsConnection,
    envelope: WsEnvelope,
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
 * `Cookie` ヘッダを `{ name: value }` 形式に分解する
 * `decodeURIComponent` の失敗は単一 Cookie の取り込みを諦めるだけで、他の Cookie 解析は続行する
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
