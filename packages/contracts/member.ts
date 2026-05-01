import * as z from "zod";

export const MemberId = z.string().min(1).brand<"MemberId">();
export type MemberId = z.infer<typeof MemberId>;

export const Member = z.object({
  id: MemberId,
  name: z.string().min(1).max(24),
  joinedAt: z.iso.datetime(),
});
export type Member = z.infer<typeof Member>;
