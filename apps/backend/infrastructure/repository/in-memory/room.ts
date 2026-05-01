import { Injectable } from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import type { RoomRepository } from "../../../domain/room";

/**
 * `RoomRepository` の in-memory 実装、単一プロセスの `Map` に `Room` を ID キーで保持する
 */
@Injectable()
export class InMemoryRoomRepository implements RoomRepository {
  private readonly store = new Map<RoomId, Room>();

  async save(room: Room): Promise<void> {
    this.store.set(room.id, room);
  }

  async find(id: RoomId): Promise<Room | null> {
    return this.store.get(id) ?? null;
  }

  async remove(id: RoomId): Promise<void> {
    this.store.delete(id);
  }
}
