import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { WsHub } from "../../infrastructure/transport/ws";

export const topic = (roomId: RoomId, memberId: MemberId): string =>
  `room:${roomId}:hallway:${memberId}`;

export const broadcastToMembers = async <T>(
  hub: WsHub,
  roomId: RoomId,
  memberIds: readonly MemberId[],
  name: string,
  data: T,
): Promise<void> => {
  await Promise.all(
    memberIds.map((memberId) => hub.broadcast(topic(roomId, memberId), name, data)),
  );
};
