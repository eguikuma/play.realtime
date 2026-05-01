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
 * 全機能の PubSub トピックを網羅する union
 * `PubSub.publish` や `SseHub.broadcast`、`WsHub.broadcast` の引数型として使い、素の文字列や別機能のトピックを渡せないようにする
 */
export type Topic = VibeTopic | MurmurTopic | BgmTopic | HallwayTopic;
