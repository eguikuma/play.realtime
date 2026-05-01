import type { BgmState, RoomId } from "@play.realtime/contracts";

export type BgmRepository = {
  get: (roomId: RoomId) => Promise<BgmState | null>;

  save: (roomId: RoomId, state: BgmState) => Promise<void>;

  remove: (roomId: RoomId) => Promise<void>;
};

export const BgmRepository = "BgmRepository" as const;
