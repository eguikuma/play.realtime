import * as z from "zod";

/**
 * ルーム内でメンバーを一意に識別するブランド型
 * 素の `string` との混同を型で防ぐため branded string として扱う
 */
export const MemberId = z.string().min(1).brand<"MemberId">();
export type MemberId = z.infer<typeof MemberId>;

/**
 * ルームに参加している 1 人のメンバーを表す公開プロフィール
 * 認証なしで入室するため本名や ID の代わりに表示名と参加時刻のみを保持する
 */
export const Member = z.object({
  /** メンバーを一意に識別するブランド型 ID */
  id: MemberId,
  /** ルーム内で他メンバーに見せる表示名、1 文字以上 24 文字以下 */
  name: z.string().min(1).max(24),
  /** ルームへ参加した時刻を ISO 8601 形式で保持する */
  joinedAt: z.iso.datetime(),
});
export type Member = z.infer<typeof Member>;
