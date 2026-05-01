import * as z from "zod";

/**
 * API サーバの Origin
 * ビルド時に `NEXT_PUBLIC_API_ORIGIN` が与えられればその値、未設定ならローカル開発の既定値を使い、不正な URL なら起動時点で throw する
 */
export const origin = z.url().parse(process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:4000");

/**
 * WebSocket 接続先 Origin
 * `origin` の `http` や `https` を対応する `ws` や `wss` に置き換えた値、別変数を増やさずに HTTP 側と一貫させる
 */
export const wsOrigin = origin.replace(/^http/, "ws");
