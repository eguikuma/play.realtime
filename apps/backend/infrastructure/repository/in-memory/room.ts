import { Injectable } from "@nestjs/common";
import type { Room, RoomId } from "@play.realtime/contracts";
import type { RoomRepository } from "../../../domain/room";

/**
 * ルームの仮置き実装
 * ルーム ID 別にルーム情報をマップで保持し 保存と取得をそのまま転写する
 */
@Injectable()
export class InMemoryRoomRepository implements RoomRepository {
  /**
   * ルーム ID を鍵としてルーム情報を持つ台帳
   */
  private readonly store = new Map<RoomId, Room>();

  /**
   * ルームを上書き保存する
   */
  async save(room: Room): Promise<void> {
    this.store.set(room.id, room);
  }

  /**
   * 指定 ID のルームを返し 未登録ならなしを返す
   */
  async find(id: RoomId): Promise<Room | null> {
    return this.store.get(id) ?? null;
  }
}
