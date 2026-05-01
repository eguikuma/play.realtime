import { Injectable } from "@nestjs/common";
import type { BgmState, RoomId } from "@play.realtime/contracts";
import type { BgmRepository } from "../../../domain/bgm";

/**
 * BGM 状態の仮置き実装
 * ルームごとに 1 つの BGM 状態をマップで保持し 取得と保存をそのまま転写する
 */
@Injectable()
export class InMemoryBgmRepository implements BgmRepository {
  /**
   * ルーム ID を鍵として BGM 状態を持つ台帳
   */
  private readonly store = new Map<RoomId, BgmState>();

  /**
   * 指定ルームの BGM 状態を返し 未設定ならなしを返す
   */
  async get(roomId: RoomId): Promise<BgmState | null> {
    return this.store.get(roomId) ?? null;
  }

  /**
   * 指定ルームの BGM 状態を上書き保存する
   */
  async save(roomId: RoomId, state: BgmState): Promise<void> {
    this.store.set(roomId, state);
  }
}
