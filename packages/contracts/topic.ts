/**
 * Vibe 機能の PubSub トピックを表す branded type
 * `room:{roomId}:vibe` 形式の文字列に、他機能のトピックと型レベルで区別するためのブランドを付ける
 */
export type VibeTopic = string & { readonly __brand: "VibeTopic" };

/**
 * ひとこと機能の PubSub トピックを表す branded type
 * `room:{roomId}:murmur` 形式の文字列に、他機能のトピックと型レベルで区別するためのブランドを付ける
 */
export type MurmurTopic = string & { readonly __brand: "MurmurTopic" };

/**
 * BGM 機能の PubSub トピックを表す branded type
 * `room:{roomId}:bgm` 形式の文字列に、他機能のトピックと型レベルで区別するためのブランドを付ける
 */
export type BgmTopic = string & { readonly __brand: "BgmTopic" };

/**
 * 廊下トーク機能の PubSub トピックを表す branded type
 * `room:{roomId}:hallway:{memberId}` 形式の文字列に、他機能のトピックと型レベルで区別するためのブランドを付ける
 */
export type HallwayTopic = string & { readonly __brand: "HallwayTopic" };

/**
 * 在室遷移配信用の PubSub トピックを表す branded type
 * 全ルーム共通の `presence:transition` 固定文字列を使い、複数インスタンス間でルームの populated/empty 遷移を共有する
 */
export type PresenceTopic = string & { readonly __brand: "PresenceTopic" };

/**
 * ルーム横断の管理シグナル用 PubSub トピックを表す branded type
 * `room:member-leave` のような全ルーム共通の固定文字列を持ち、複数インスタンス間で member 単位の強制退出指示を fanout する
 */
export type RoomTopic = string & { readonly __brand: "RoomTopic" };

/**
 * 全機能の PubSub トピックを網羅する union
 * `PubSub.publish` や `SseHub.broadcast`、`WsHub.broadcast` の引数型として使い、素の文字列や別機能のトピックを渡せないようにする
 */
export type Topic = VibeTopic | MurmurTopic | BgmTopic | HallwayTopic | PresenceTopic | RoomTopic;
