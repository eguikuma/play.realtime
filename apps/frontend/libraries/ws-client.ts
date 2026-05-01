import { createNativeWsClient } from "@/libraries/transport/ws";

/**
 * アプリ全体で共有する WebSocket クライアントのシングルトン
 * 生 `WebSocket` ベースの実装を 1 箇所に集約し、廊下トーク機能の接続管理を一貫させる
 */
export const ws = createNativeWsClient();
