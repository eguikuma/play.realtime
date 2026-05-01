import type { CookieOptions } from "express";

/**
 * 自分のメンバー ID をブラウザ側で保持するための Cookie 名
 * `GET /rooms/{roomId}/me` と各種 HTTP 経路が Cookie から `MemberId` を取り出して呼び出し元を特定する
 */
export const MEMBER_COOKIE = "memberId";

/**
 * `MEMBER_COOKIE` に設定する属性
 * `httpOnly` で JS からの参照を禁止、`sameSite: strict` で CSRF を抑止、`secure` は本番環境だけ有効化してローカル開発の HTTP アクセスを許す
 * `maxAge` は 24 時間とし、半日以上タブを開きっぱなしでも再入室時に Cookie が残っている寿命に合わせる
 */
export const MEMBER_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === "production",
};
