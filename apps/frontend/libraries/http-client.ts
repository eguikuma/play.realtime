import { createNativeHttpClient } from "@/libraries/transport";
import { origin } from "./environment";

/**
 * アプリ全体で共有する HTTP クライアントのシングルトン
 * native fetch ベースの実装を 1 箇所に集約することで、将来差し替え / mock 化のポイントを 1 本に絞る
 */
export const http = createNativeHttpClient({ origin });
