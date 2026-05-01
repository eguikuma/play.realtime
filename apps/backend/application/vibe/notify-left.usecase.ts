import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { VibePresenceGrace } from "./presence-grace";
import { topic } from "./topic";

@Injectable()
export class NotifyVibeLeft {
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
    private readonly grace: VibePresenceGrace,
  ) {}

  async execute(input: {
    roomId: RoomId;
    memberId: MemberId;
    connectionId: ConnectionId;
  }): Promise<void> {
    const { isLast, aggregated } = await this.vibes.delete(
      input.roomId,
      input.memberId,
      input.connectionId,
    );
    if (isLast || aggregated === null) {
      this.grace.schedule(input.roomId, input.memberId, async () => {
        await this.hub.broadcast(topic(input.roomId), "Left", {
          memberId: input.memberId,
        });
      });
      return;
    }
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.memberId,
      status: aggregated,
    });
  }
}
