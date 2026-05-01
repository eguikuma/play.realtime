import * as z from "zod";
import { Member, MemberId } from "./member";

export const VibeStatus = z.enum(["present", "focused"]);
export type VibeStatus = z.infer<typeof VibeStatus>;

export const ConnectionId = z.string().min(1).brand<"ConnectionId">();
export type ConnectionId = z.infer<typeof ConnectionId>;

export const Vibe = z.object({
  memberId: MemberId,
  status: VibeStatus,
});
export type Vibe = z.infer<typeof Vibe>;

export const VibeWelcome = z.object({
  connectionId: ConnectionId,
});
export type VibeWelcome = z.infer<typeof VibeWelcome>;

export const VibeSnapshot = z.object({
  members: z.array(Member),

  statuses: z.array(Vibe),
});
export type VibeSnapshot = z.infer<typeof VibeSnapshot>;

export const VibeJoined = z.object({
  member: Member,

  status: VibeStatus,
});
export type VibeJoined = z.infer<typeof VibeJoined>;

export const VibeLeft = z.object({
  memberId: MemberId,
});
export type VibeLeft = z.infer<typeof VibeLeft>;

export const VibeUpdate = z.object({
  memberId: MemberId,
  status: VibeStatus,
});
export type VibeUpdate = z.infer<typeof VibeUpdate>;

export const VibeEvents = {
  Welcome: VibeWelcome,
  Snapshot: VibeSnapshot,
  Joined: VibeJoined,
  Left: VibeLeft,
  Update: VibeUpdate,
} as const;

export const ChangeVibeStatusRequest = z.object({
  connectionId: ConnectionId,
  status: VibeStatus,
});
export type ChangeVibeStatusRequest = z.infer<typeof ChangeVibeStatusRequest>;
