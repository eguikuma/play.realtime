import type { HallwayTopic, MemberId, RoomId } from "@play.realtime/contracts";

/**
 * 廊下トークの PubSub トピックを組み立てるヘルパ束
 * 招待や通話の開始終了は在室メンバー全員に同じイベントを届けるため `Topic.room(roomId)` のルーム単位トピックを使い、通話メッセージは参加者 2 名のみに届けるため `Topic.message(roomId, memberId)` のメンバー単位トピックを使い分ける
 * 戻り値は `HallwayTopic` ブランド付きにして、他機能のトピックを受け取るメソッドに誤って渡せないようにする
 * 全件 `room:{roomId}:` プレフィックス配下に揃え、`PubSub.closeByPrefix` でルーム閉鎖時にまとめて掃除できる
 */
export const Topic = {
  room: (roomId: RoomId): HallwayTopic => `room:${roomId}:hallway` as HallwayTopic,
  message: (roomId: RoomId, memberId: MemberId): HallwayTopic =>
    `room:${roomId}:hallway:message:${memberId}` as HallwayTopic,
} as const;
