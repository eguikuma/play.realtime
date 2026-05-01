import * as z from "zod";

/**
 * メンバーを一意に識別する ID
 * サーバーが発行しルーム内の操作や配信で一貫して識別子として使う
 */
export const MemberId = z.string().min(1).brand<"MemberId">();
export type MemberId = z.infer<typeof MemberId>;

/**
 * ルームに所属する 1 名のメンバーを表す
 * 表示名は UI に出す短い文字列であり 認証の用途には使わない
 */
export const Member = z.object({
  id: MemberId,
  name: z.string().min(1).max(24),
  joinedAt: z.iso.datetime(),
});
export type Member = z.infer<typeof Member>;
