import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId, VibeStatus } from "@play.realtime/contracts";
import { RoomNotFound, RoomRepository } from "../../domain/room";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { topic } from "./topic";

@Injectable()
export class ChangeVibeStatus {
  constructor(
    @Inject(RoomRepository) private readonly rooms: RoomRepository,
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
  ) {}

  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    connectionId: ConnectionId;
    status: VibeStatus;
  }): Promise<void> {
    const room = await this.rooms.find(input.roomId);
    if (!room) {
      throw new RoomNotFound(input.roomId);
    }
    const { updated, aggregated } = await this.vibes.update(
      input.roomId,
      input.memberId,
      input.connectionId,
      input.status,
    );
    if (!updated || aggregated === null) {
      return;
    }
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
