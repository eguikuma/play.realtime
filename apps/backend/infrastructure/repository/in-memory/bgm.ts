import { Injectable } from "@nestjs/common";
import type { BgmState, RoomId } from "@play.realtime/contracts";
import type { BgmRepository } from "../../../domain/bgm";

/**
 * `BgmRepository` の in-memory 実装、ルーム 1 件ごとに現在状態を 1 つだけ保持する
 */
@Injectable()
export class InMemoryBgmRepository implements BgmRepository {
  private readonly store = new Map<RoomId, BgmState>();

  async get(roomId: RoomId): Promise<BgmState | null> {
    return this.store.get(roomId) ?? null;
  }

  async save(roomId: RoomId, state: BgmState): Promise<void> {
    this.store.set(roomId, state);
  }

  async remove(roomId: RoomId): Promise<void> {
    this.store.delete(roomId);
  }
}
