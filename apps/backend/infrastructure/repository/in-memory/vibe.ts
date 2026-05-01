import { Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";
import type { VibeRepository } from "../../../domain/vibe";
import { aggregate } from "../../../domain/vibe";

/**
 * 空気の仮置き実装
 * ルーム メンバー 接続の 3 階層マップで生データを保持し 取り出しのたびに集約する
 * 初回か最後かの結果を返すことで ユースケース側は参加や離脱の判定を自分で行わずに済む
 */
@Injectable()
export class InMemoryVibeRepository implements VibeRepository {
  /**
   * ルームとメンバーと接続ごとの状態を保持する 3 階層マップの台帳
   */
  private readonly store = new Map<RoomId, Map<MemberId, Map<ConnectionId, VibeStatus>>>();

  /**
   * 接続単位の状態を保存して 集約後の値と「メンバーの初接続か」を返す
   */
  async save(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ isFirst: boolean; aggregated: VibeStatus }> {
    const room = this.store.get(roomId) ?? new Map<MemberId, Map<ConnectionId, VibeStatus>>();
    this.store.set(roomId, room);
    const connections = room.get(memberId) ?? new Map<ConnectionId, VibeStatus>();
    const isFirst = connections.size === 0;
    connections.set(connectionId, status);
    room.set(memberId, connections);
    const aggregated = aggregate([...connections.values()]);
    return { isFirst, aggregated };
  }

  /**
   * 接続単位の状態を削除して 集約後の値と「メンバーの最終接続か」を返す
   * メンバー単位の空マップもここで後片付けする
   */
  async delete(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ): Promise<{ isLast: boolean; aggregated: VibeStatus | null }> {
    const room = this.store.get(roomId);
    const connections = room?.get(memberId);
    if (!room || !connections) {
      return { isLast: true, aggregated: null };
    }
    connections.delete(connectionId);
    if (connections.size === 0) {
      room.delete(memberId);
      return { isLast: true, aggregated: null };
    }
    return { isLast: false, aggregated: aggregate([...connections.values()]) };
  }

  /**
   * ルーム内の全メンバーの集約後の状態一覧を返す
   */
  async snapshot(roomId: RoomId): Promise<Vibe[]> {
    const room = this.store.get(roomId);
    if (!room) {
      return [];
    }
    return [...room.entries()].map(([memberId, connections]) => ({
      memberId,
      status: aggregate([...connections.values()]),
    }));
  }

  /**
   * 指定メンバーの集約後の状態を返し 未接続ならなしを返す
   */
  async get(roomId: RoomId, memberId: MemberId): Promise<VibeStatus | null> {
    const connections = this.store.get(roomId)?.get(memberId);
    if (!connections || connections.size === 0) {
      return null;
    }
    return aggregate([...connections.values()]);
  }

  /**
   * 指定ルームの階層ごと台帳から取り除く
   * 既に存在しない場合も Map.delete が false を返すだけなので冪等になる
   */
  async remove(roomId: RoomId): Promise<void> {
    this.store.delete(roomId);
  }
}
