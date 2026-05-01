import type { Room, RoomId } from "@play.realtime/contracts";

export type RoomRepository = {
  save: (room: Room) => Promise<void>;

  find: (id: RoomId) => Promise<Room | null>;

  remove: (id: RoomId) => Promise<void>;
};

export const RoomRepository = "RoomRepository" as const;
