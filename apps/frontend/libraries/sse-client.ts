import { createNativeSseClient } from "@/libraries/transport";

/**
 * アプリ全体で共有する SSE クライアントのシングルトン
 * `EventSource` ベースの実装を 1 箇所に集約することで、将来の接続制御強化や mock 化を 1 本で済ます
 */
export const sse = createNativeSseClient();
