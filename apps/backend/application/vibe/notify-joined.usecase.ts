import { Inject, Injectable } from "@nestjs/common";
import type { ConnectionId, Member, RoomId } from "@play.realtime/contracts";
import { VibeRepository } from "../../domain/vibe";
import { SseHub } from "../../infrastructure/transport/sse";
import { VibePresenceGrace } from "./presence-grace";
import { topic } from "./topic";

@Injectable()
export class NotifyVibeJoined {
  constructor(
    @Inject(VibeRepository) private readonly vibes: VibeRepository,
    private readonly hub: SseHub,
    private readonly grace: VibePresenceGrace,
  ) {}

  async execute(input: {
    roomId: RoomId;
    member: Member;
    connectionId: ConnectionId;
  }): Promise<void> {
    const { isFirst, aggregated } = await this.vibes.save(
      input.roomId,
      input.member.id,
      input.connectionId,
      "present",
    );
    const rejoined = this.grace.cancel(input.roomId, input.member.id);
    if (isFirst && !rejoined) {
      await this.hub.broadcast(topic(input.roomId), "Joined", {
        member: input.member,
        status: aggregated,
      });
      return;
    }
    await this.hub.broadcast(topic(input.roomId), "Update", {
      memberId: input.member.id,
      status: aggregated,
    });
  }
}
