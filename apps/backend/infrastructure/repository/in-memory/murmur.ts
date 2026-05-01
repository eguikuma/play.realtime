import { Injectable } from "@nestjs/common";
import type { Murmur, RoomId } from "@play.realtime/contracts";
import type { MurmurRepository } from "../../../domain/murmur";

/**
 * `MurmurRepository` の in-memory 実装、ルーム単位で投稿を配列として push で追加する
 * 投稿順序は配列のインデックスに依存し、`latest` は末尾から指定件数を切り出して古い順で返す
 */
@Injectable()
export class InMemoryMurmurRepository implements MurmurRepository {
  private readonly store = new Map<RoomId, Murmur[]>();

  async save(murmur: Murmur): Promise<void> {
    const items = this.store.get(murmur.roomId) ?? [];
    items.push(murmur);
    this.store.set(murmur.roomId, items);
  }

  async latest(roomId: RoomId, limit: number): Promise<Murmur[]> {
    const items = this.store.get(roomId) ?? [];
    return items.slice(-limit);
  }

  async remove(roomId: RoomId): Promise<void> {
    this.store.delete(roomId);
  }
}
