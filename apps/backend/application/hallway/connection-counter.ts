import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";

@Injectable()
export class HallwayConnectionCounter {
  private readonly counts = new Map<string, number>();

  attach(roomId: RoomId, memberId: MemberId): { isFirst: boolean } {
    const key = this.key(roomId, memberId);
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return { isFirst: next === 1 };
  }

  detach(roomId: RoomId, memberId: MemberId): { isLast: boolean } {
    const key = this.key(roomId, memberId);
    const current = this.counts.get(key) ?? 0;
    const next = current - 1;
    if (next <= 0) {
      this.counts.delete(key);
      return { isLast: true };
    }
    this.counts.set(key, next);
    return { isLast: false };
  }

  private key(roomId: RoomId, memberId: MemberId): string {
    return `${roomId}:${memberId}`;
  }
}
