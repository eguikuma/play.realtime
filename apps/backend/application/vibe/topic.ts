import type { RoomId } from "@play.realtime/contracts";

export const topic = (roomId: RoomId): string => `room:${roomId}:vibe`;
