import type { ConnectionId, MemberId, RoomId, Vibe, VibeStatus } from "@play.realtime/contracts";

export type VibeRepository = {
  save: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ isFirst: boolean; aggregated: VibeStatus }>;

  update: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
    status: VibeStatus,
  ) => Promise<{ updated: boolean; aggregated: VibeStatus | null }>;

  delete: (
    roomId: RoomId,
    memberId: MemberId,
    connectionId: ConnectionId,
  ) => Promise<{ isLast: boolean; aggregated: VibeStatus | null }>;

  snapshot: (roomId: RoomId) => Promise<Vibe[]>;

  get: (roomId: RoomId, memberId: MemberId) => Promise<VibeStatus | null>;

  remove: (roomId: RoomId) => Promise<void>;
};

export const VibeRepository = "VibeRepository" as const;
