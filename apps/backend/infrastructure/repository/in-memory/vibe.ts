import { Injectable } from "@nestjs/common";
import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";
import type { VibeRepository } from "../../../domain/vibe";
import { aggregate } from "../../../domain/vibe";

@Injectable()
export class InMemoryVibeRepository implements VibeRepository {
  private readonly store = new Map<RoomId, Map<MemberId, Map<ConnectionId, VibeStatus>>>();

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

  async update(
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ): Promise<{ updated: boolean; aggregated: VibeStatus | null }> {
    const connections = this.store.get(roomId)?.get(memberId);
    if (!connections?.has(connectionId)) {
      return { updated: false, aggregated: null };
    }
    connections.set(connectionId, status);
    return { updated: true, aggregated: aggregate([...connections.values()]) };
  }

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

  async get(roomId: RoomId, memberId: MemberId): Promise<VibeStatus | null> {
    const connections = this.store.get(roomId)?.get(memberId);
    if (!connections || connections.size === 0) {
      return null;
    }
    return aggregate([...connections.values()]);
  }

  async remove(roomId: RoomId): Promise<void> {
    this.store.delete(roomId);
  }
}
