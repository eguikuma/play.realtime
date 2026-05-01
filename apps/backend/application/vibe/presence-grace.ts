import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

const GRACE_MS = 1500;

const keyOf = (roomId: RoomId, memberId: MemberId) => `${roomId}:${memberId}`;

@Injectable()
export class VibePresenceGrace {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  schedule(roomId: RoomId, memberId: MemberId, fire: () => void | Promise<void>): void {
    const key = keyOf(roomId, memberId);
    const existing = this.timers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing);
    }
    const timeout = setTimeout(() => {
      this.timers.delete(key);
      void fire();
    }, GRACE_MS);
    this.timers.set(key, timeout);
  }

  cancel(roomId: RoomId, memberId: MemberId): boolean {
    const key = keyOf(roomId, memberId);
    const timeout = this.timers.get(key);
    if (timeout === undefined) {
      return false;
    }
    clearTimeout(timeout);
    this.timers.delete(key);
    return true;
  }
}
