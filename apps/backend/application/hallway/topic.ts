import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { WsHub } from "../../infrastructure/transport/ws";

/**
 * 廊下トークのトピック名を組み立てるヘルパ
 * メンバー単位で購読を区切るため `room:{roomId}:hallway:{memberId}` 形式にしており、ルーム閉鎖時に `PubSub.closeByPrefix` で `room:{roomId}:hallway:` をまとめて掃除できる
 */
export const topic = (roomId: RoomId, memberId: MemberId): string =>
  `room:${roomId}:hallway:${memberId}`;

/**
 * 指定メンバー全員宛に並列で WebSocket 配信するヘルパ
 * 送信先メンバー数は通常 2 (通話参加者) またはルーム人数分で、直列配信では遅延が積み重なるため `Promise.all` で捌く
 */
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
