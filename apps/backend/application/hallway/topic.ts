import { HallwayServerMessages, type MemberId, type RoomId } from "@play.realtime/contracts";
import type { z } from "zod";
import type { WsHub } from "../../infrastructure/transport/ws";

/**
 * 廊下トークのトピック名を組み立てるヘルパ
 * メンバー単位で購読を区切るため `room:{roomId}:hallway:{memberId}` 形式にしており、ルーム閉鎖時に `PubSub.closeByPrefix` で `room:{roomId}:hallway:` をまとめて掃除できる
 */
export const topic = (roomId: RoomId, memberId: MemberId): string =>
  `room:${roomId}:hallway:${memberId}`;

/**
 * 指定メンバー全員宛に並列で WebSocket 配信するヘルパ
 * 送信先メンバー数は通常 2 名の通話参加者、またはルーム人数分で、直列配信では遅延が積み重なるため `Promise.all` で捌く
 * `name` と `data` は `HallwayServerMessages` 辞書で型が束縛され、辞書にないキーや payload 不一致を呼び出し側で弾く
 */
export const broadcastToMembers = async <
  K extends Extract<keyof typeof HallwayServerMessages, string>,
>(
  hub: WsHub,
  roomId: RoomId,
  memberIds: readonly MemberId[],
  name: K,
  data: z.infer<(typeof HallwayServerMessages)[K]>,
): Promise<void> => {
  await Promise.all(
    memberIds.map((memberId) =>
      hub.broadcast(HallwayServerMessages, topic(roomId, memberId), name, data),
    ),
  );
};
