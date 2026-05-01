import type { CookieOptions } from "express";

/**
 * メンバー識別で使う cookie の名前
 * ログイン不要の参加体験を保ちつつ 「私は誰か」をリロード越しに保持するための鍵とする
 */
export const MEMBER_COOKIE = "memberId";

/**
 * メンバー用 cookie の送出オプション
 * httpOnly と sameSite strict でクロスサイトからの読み書きを防ぎ 本番環境に限って secure を付与する
 */
export const MEMBER_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === "production",
};
