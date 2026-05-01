import type { MemberId, RoomId } from "@play.realtime/contracts";
import type { WsHub } from "../../infrastructure/transport/ws";

/**
 * 廊下トークの配信で使うパブリッシュ購読のトピック名を組み立てる
 * ルームとメンバーの両方を含めることで「自分宛のイベントだけを拾う」購読を実現する
 */
export const topic = (roomId: RoomId, memberId: MemberId): string =>
  `room:${roomId}:hallway:${memberId}`;

/**
 * 指定したメンバー集合に同じイベントを同時に配信する
 * ハブへはメンバーごとに別トピックで発行し クライアント側の購読境界を揃える
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
