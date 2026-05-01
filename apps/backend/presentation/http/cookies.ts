import type { CookieOptions } from "express";

/**
 * 自分のメンバー ID をブラウザ側で保持するための Cookie 名
 * `GET /rooms/{roomId}/me` と各種 HTTP 経路が Cookie から `MemberId` を取り出して呼び出し元を特定する
 */
export const MEMBER_COOKIE = "memberId";

const SAME_SITE_VALUES = ["strict", "lax", "none"] as const;
type SameSite = (typeof SAME_SITE_VALUES)[number];
const isSameSite = (value: string | undefined): value is SameSite =>
  value !== undefined && (SAME_SITE_VALUES as readonly string[]).includes(value);

/**
 * `MEMBER_COOKIE` に設定する属性
 * `httpOnly` で JS からの参照を禁止し、`sameSite` と `secure` と `partitioned` は環境変数で切り替える
 * `maxAge` は 24 時間とし、半日以上タブを開きっぱなしでも再入室時に Cookie が残っている寿命に合わせる
 * 異なるオリジン同士の本番運用では `COOKIE_SAME_SITE=none` と `COOKIE_SECURE=true` を必ず併用する
 * ブラウザの third-party cookie ブロック下では `COOKIE_PARTITIONED=true` を併用して CHIPS で保存可能にする
 */
export const MEMBER_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: isSameSite(process.env.COOKIE_SAME_SITE) ? process.env.COOKIE_SAME_SITE : "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.COOKIE_SECURE === "true",
  partitioned: process.env.COOKIE_PARTITIONED === "true",
};
