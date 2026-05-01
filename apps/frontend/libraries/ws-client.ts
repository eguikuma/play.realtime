import { createNativeWsClient, createResilientWsClient } from "@/libraries/transport/ws";

/**
 * アプリ全体で共有する WebSocket クライアントのシングルトン
 * 生 `WebSocket` ベースの実装を切断耐性レイヤで包み、モバイル Safari の background 化やネットワーク瞬断のあとも自動で張り直す
 */
export const ws = createResilientWsClient(createNativeWsClient());
