import type { Murmur, RoomId } from "@play.realtime/contracts";

export type MurmurRepository = {
  save: (murmur: Murmur) => Promise<void>;

  latest: (roomId: RoomId, limit: number) => Promise<Murmur[]>;

  remove: (roomId: RoomId) => Promise<void>;
};

export const MurmurRepository = "MurmurRepository" as const;
