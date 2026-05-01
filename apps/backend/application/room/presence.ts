import { Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";

export type PresenceTransition = "empty" | "populated";

export type PresenceListener = (event: { roomId: RoomId; kind: PresenceTransition }) => void;

export type PresenceSubscription = {
  unsubscribe: () => void;
};

@Injectable()
export class RoomPresence {
  private readonly counts = new Map<RoomId, number>();

  private readonly listeners = new Set<PresenceListener>();

  register(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    this.counts.set(roomId, before + 1);
    if (before === 0) {
      this.fire(roomId, "populated");
    }
  }

  deregister(roomId: RoomId): void {
    const before = this.counts.get(roomId) ?? 0;
    if (before <= 0) {
      return;
    }
    const after = before - 1;
    if (after === 0) {
      this.counts.delete(roomId);
      this.fire(roomId, "empty");
      return;
    }
    this.counts.set(roomId, after);
  }

  countConnections(roomId: RoomId): number {
    return this.counts.get(roomId) ?? 0;
  }

  onTransition(listener: PresenceListener): PresenceSubscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private fire(roomId: RoomId, kind: PresenceTransition): void {
    for (const listener of [...this.listeners]) {
      try {
        listener({ roomId, kind });
      } catch {}
    }
  }
}
