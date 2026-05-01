import * as z from "zod";
import { Member, MemberId } from "./member";

export const RoomId = z
  .string()
  .regex(/^[A-Za-z0-9_-]{10,}$/)
  .brand<"RoomId">();
export type RoomId = z.infer<typeof RoomId>;

export const Room = z.object({
  id: RoomId,
  hostMemberId: MemberId,
  members: z.array(Member),
  createdAt: z.iso.datetime(),
});
export type Room = z.infer<typeof Room>;

export const CreateRoomRequest = z.object({
  hostName: z.string().min(1).max(24),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

export const JoinRoomRequest = z.object({
  name: z.string().min(1).max(24),
});
export type JoinRoomRequest = z.infer<typeof JoinRoomRequest>;

export const RoomMembership = z.object({
  room: Room,

  me: Member,
});
export type RoomMembership = z.infer<typeof RoomMembership>;
