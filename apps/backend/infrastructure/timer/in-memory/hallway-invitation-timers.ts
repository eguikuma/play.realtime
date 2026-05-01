import { Injectable } from "@nestjs/common";
import type { InvitationId } from "@play.realtime/contracts";
import type { HallwayInvitationTimers } from "../../../application/hallway/invitation-timers";

/**
 * `HallwayInvitationTimers` port の in-memory 実装
 * 単一プロセスの `Map` で招待 ID 別タイマーを保持し、`schedule` で `setTimeout`、`cancel` で `clearTimeout` する
 * 複数 backend 構成では cross-instance 同期されないため、その場合は `infrastructure/timer/redis` 側の実装を使う
 */
@Injectable()
export class InMemoryHallwayInvitationTimers implements HallwayInvitationTimers {
  private readonly timers = new Map<InvitationId, NodeJS.Timeout>();

  schedule(id: InvitationId, delayMs: number, callback: () => void): void {
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
