import { createNativeHttpClient, createNativeSseClient } from "@/libraries/transport";
import { createNativeWsClient } from "@/libraries/transport/ws";
import { origin } from "./environment";

/**
 * 機能層で共有する HTTP クライアントのインスタンス
 * オリジンは環境変数から解決し 関数ごとに新規生成する必要をなくす
 */
export const http = createNativeHttpClient({ origin });
/**
 * 機能層で共有する SSE クライアントのインスタンス
 */
export const sse = createNativeSseClient();
/**
 * 機能層で共有する WebSocket クライアントのインスタンス
 */
export const ws = createNativeWsClient();
