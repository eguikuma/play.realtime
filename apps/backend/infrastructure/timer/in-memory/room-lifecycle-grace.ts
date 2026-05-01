import { Injectable } from "@nestjs/common";
import type { RoomId } from "@play.realtime/contracts";
import type { RoomLifecycleGrace } from "../../../application/room/lifecycle-grace";

/**
 * `RoomLifecycleGrace` port の in-memory 実装
 * 単一プロセスの `Map` でルームごとの猶予タイマーを抱え、`schedule` で `setTimeout`、`cancel` で `clearTimeout` する
 * 複数 backend 構成では cross-instance 同期されず両 backend が別々に発火するため、その場合は `infrastructure/timer/redis` 側の実装を使う
 */
@Injectable()
export class InMemoryRoomLifecycleGrace implements RoomLifecycleGrace {
  private readonly timers = new Map<RoomId, NodeJS.Timeout>();
  private graceMs = 30_000;

  override(ms: number): void {
    this.graceMs = ms;
  }

  schedule(roomId: RoomId, fire: () => Promise<void>): void {
    this.cancel(roomId);

    const timer = setTimeout(() => {
      this.timers.delete(roomId);
      void fire();
    }, this.graceMs);
    this.timers.set(roomId, timer);
  }

  cancel(roomId: RoomId): void {
    const timer = this.timers.get(roomId);
    if (timer === undefined) {
      return;
    }

    clearTimeout(timer);
    this.timers.delete(roomId);
  }
}
