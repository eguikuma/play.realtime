import * as z from "zod";

/**
 * ブラウザ側に露出する API オリジン
 * NEXT_PUBLIC_API_ORIGIN を Zod で検証し 未設定時は開発用の既定値に落とす
 */
export const origin = z.url().parse(process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:4000");

/**
 * WebSocket 接続で使う 同じサーバーの ws オリジン
 * http や https を ws や wss に置き換えるだけで 他の部分はオリジンと揃える
 */
export const wsOrigin = origin.replace(/^http/, "ws");
