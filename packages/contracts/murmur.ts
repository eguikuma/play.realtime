import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";

export const MurmurId = z.string().min(1).brand<"MurmurId">();
export type MurmurId = z.infer<typeof MurmurId>;

export const Murmur = z.object({
  id: MurmurId,
  roomId: RoomId,
  memberId: MemberId,
  text: z.string().min(1).max(140),
  postedAt: z.iso.datetime(),
});
export type Murmur = z.infer<typeof Murmur>;

export const PostMurmurRequest = z.object({
  text: z.string().min(1).max(140),
});
export type PostMurmurRequest = z.infer<typeof PostMurmurRequest>;

export const MurmurSnapshot = z.object({
  items: z.array(Murmur),
});
export type MurmurSnapshot = z.infer<typeof MurmurSnapshot>;

export const MurmurEvents = {
  Snapshot: MurmurSnapshot,
  Posted: Murmur,
} as const;
