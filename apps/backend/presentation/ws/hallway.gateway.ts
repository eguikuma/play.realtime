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

@Injectable()
export class HallwayGateway implements OnModuleInit {
  private readonly logger = new Logger(HallwayGateway.name);

  private readonly wsServer = new WebSocketServer({ noServer: true });

  private readonly environment = load();

  private readonly pathPattern = /^\/rooms\/([^/?#]+)\/hallway(?:\?.*)?$/;

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

  onModuleInit(): void {
    const httpServer = this.adapter.httpAdapter.getHttpServer();
    httpServer.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      void this.onUpgrade(request, socket, head);
    });
  }

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
