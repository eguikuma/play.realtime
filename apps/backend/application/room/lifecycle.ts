import { Inject, Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import { PubSub } from "../ports/pubsub";
import { RoomPresence } from "./presence";

export type RoomCleanup = (roomId: RoomId) => Promise<void>;

@Injectable()
export class RoomLifecycle {
  private readonly cleanups: RoomCleanup[] = [];

  private readonly graceTimers = new Map<RoomId, NodeJS.Timeout>();

  private graceMs = 30_000;

  constructor(
    private readonly presence: RoomPresence,
    @Inject(PubSub) private readonly pubsub: PubSub,
  ) {
    this.presence.onTransition((event) => {
      if (event.kind === "empty") {
        this.startGrace(event.roomId);
      } else {
        this.cancelGrace(event.roomId);
      }
    });
  }

  registerCleanup(cleanup: RoomCleanup): void {
    this.cleanups.push(cleanup);
  }

  overrideGracePeriod(ms: number): void {
    this.graceMs = ms;
  }

  async destroy(roomId: RoomId): Promise<void> {
    this.cancelGrace(roomId);
    for (const cleanup of this.cleanups) {
      try {
        await cleanup(roomId);
      } catch {}
    }
    this.pubsub.closeByPrefix(`room:${roomId}:`);
  }

  private startGrace(roomId: RoomId): void {
    this.cancelGrace(roomId);
    const timer = setTimeout(() => {
      this.graceTimers.delete(roomId);
      void this.destroy(roomId);
    }, this.graceMs);
    this.graceTimers.set(roomId, timer);
  }

  private cancelGrace(roomId: RoomId): void {
    const timer = this.graceTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(roomId);
    }
  }
}
