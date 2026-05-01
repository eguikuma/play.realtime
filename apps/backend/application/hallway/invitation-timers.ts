import { Injectable } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";

@Injectable()
export class HallwayInvitationTimers {
  private readonly timers = new Map<InvitationId, NodeJS.Timeout>();

  register(id: InvitationId, delayMs: number, callback: () => void): void {
    const timeout = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delayMs);
    this.timers.set(id, timeout);
  }

  cancel(id: InvitationId): void {
    const timeout = this.timers.get(id);
    if (timeout === undefined) {
      return;
    }
    clearTimeout(timeout);
    this.timers.delete(id);
  }
}
