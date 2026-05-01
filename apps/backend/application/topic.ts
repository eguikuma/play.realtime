import type { PresenceTopic, RoomTopic } from "@play.realtime/contracts";

/**
 * 機能横断のグローバル PubSub トピックを束ねた定数
 * ルーム別のトピックは各機能の `application/<feature>/topic.ts` 配下で組み立てるが、ルーム ID を持たないシステム全体配信用は本オブジェクトに集約する
 */
export const GlobalTopic = {
  /**
   * `PresenceTransition` は populated と empty の遷移を全インスタンス間で共有する経路
   */
  PresenceTransition: "presence:transition" as PresenceTopic,
  /**
   * `MemberLeft` は `pagehide` 起点の明示退出シグナルを SSE と WebSocket の両 Hub に fanout する経路
   */
  MemberLeft: "room:member-leave" as RoomTopic,
} as const;
