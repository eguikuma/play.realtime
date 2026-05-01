import type { CookieOptions } from "express";

export const MEMBER_COOKIE = "memberId";

export const MEMBER_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
  secure: process.env.NODE_ENV === "production",
};
