import { Injectable } from "@nestjs/common";
import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { HallwayConnectionCounter } from "../../../application/hallway/connection-counter";

const keyOf = (roomId: RoomId, memberId: MemberId) => `${roomId}:${memberId}`;

/**
 * `HallwayConnectionCounter` port の in-memory 実装
 * 単一プロセスの `Map` でルーム × メンバーごとの WebSocket 接続数を抱え、`attach` で +1、`detach` で -1 する
 * 同じメンバーの接続が複数 backend にまたがるケースでは cross-instance 集計されないため、その場合は `infrastructure/counter/redis` 側の実装で `HINCRBY` に倒す
 */
@Injectable()
export class InMemoryHallwayConnectionCounter implements HallwayConnectionCounter {
  private readonly counts = new Map<string, number>();

  attach(roomId: RoomId, memberId: MemberId): { isFirst: boolean } {
    const key = keyOf(roomId, memberId);
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return { isFirst: next === 1 };
  }

  detach(roomId: RoomId, memberId: MemberId): { isLast: boolean } {
    const key = keyOf(roomId, memberId);
    const current = this.counts.get(key) ?? 0;
    const next = current - 1;
    if (next <= 0) {
      this.counts.delete(key);
      return { isLast: true };
    }

    this.counts.set(key, next);
    return { isLast: false };
  }
}
