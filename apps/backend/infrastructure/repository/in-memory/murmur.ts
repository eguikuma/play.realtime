import { Injectable } from "@nestjs/common";
import type { Murmur, RoomId } from "@play.realtime/contracts";
import type { MurmurRepository } from "../../../domain/murmur";

/**
 * ひとこと投稿の仮置き実装
 * ルームごとに到着順の配列を保持し 取得時は末尾から指定件数を切り出す
 */
@Injectable()
export class InMemoryMurmurRepository implements MurmurRepository {
  /**
   * ルーム ID 別のひとこと投稿配列を 到着順のまま持つ
   */
  private readonly store = new Map<RoomId, Murmur[]>();

  /**
   * ひとこと投稿を 1 件追加する
   */
  async save(murmur: Murmur): Promise<void> {
    const items = this.store.get(murmur.roomId) ?? [];
    items.push(murmur);
    this.store.set(murmur.roomId, items);
  }

  /**
   * 指定ルームの最新の指定件数を 到着順のまま返す
   * 件数が指定に満たない場合は全件を返す
   */
  async latest(roomId: RoomId, limit: number): Promise<Murmur[]> {
    const items = this.store.get(roomId) ?? [];
    return items.slice(-limit);
  }

  /**
   * 指定ルームのひとこと投稿を台帳から取り除く
   * 既に存在しない場合も冪等に無視する
   */
  async remove(roomId: RoomId): Promise<void> {
    this.store.delete(roomId);
  }
}
