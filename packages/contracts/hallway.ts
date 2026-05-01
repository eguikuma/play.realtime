import * as z from "zod";
import { MemberId } from "./member";
import { RoomId } from "./room";
import { ConnectionId } from "./vibe";

export const InvitationId = z.string().min(1).brand<"InvitationId">();
export type InvitationId = z.infer<typeof InvitationId>;

export const CallId = z.string().min(1).brand<"CallId">();
export type CallId = z.infer<typeof CallId>;

export const Invitation = z.object({
  id: InvitationId,
  roomId: RoomId,
  fromMemberId: MemberId,
  toMemberId: MemberId,
  expiresAt: z.iso.datetime(),
});
export type Invitation = z.infer<typeof Invitation>;

export const Call = z.object({
  id: CallId,
  roomId: RoomId,
  memberIds: z.tuple([MemberId, MemberId]),
  startedAt: z.iso.datetime(),
});
export type Call = z.infer<typeof Call>;

export const CallMessage = z.object({
  callId: CallId,
  fromMemberId: MemberId,
  text: z.string().min(1).max(500),
  sentAt: z.iso.datetime(),
});
export type CallMessage = z.infer<typeof CallMessage>;

export const CallEndReason = z.enum(["explicit", "disconnect"]);
export type CallEndReason = z.infer<typeof CallEndReason>;

export const HallwayWelcome = z.object({
  connectionId: ConnectionId,
});
export type HallwayWelcome = z.infer<typeof HallwayWelcome>;

export const HallwaySnapshot = z.object({
  invitations: z.array(Invitation),
  calls: z.array(Call),
});
export type HallwaySnapshot = z.infer<typeof HallwaySnapshot>;

export const HallwayInvited = z.object({
  invitation: Invitation,
});
export type HallwayInvited = z.infer<typeof HallwayInvited>;

export const InvitationEndReason = z.enum(["expired", "declined", "cancelled", "accepted"]);
export type InvitationEndReason = z.infer<typeof InvitationEndReason>;

export const HallwayInvitationEnded = z.object({
  invitationId: InvitationId,
  reason: InvitationEndReason,
});
export type HallwayInvitationEnded = z.infer<typeof HallwayInvitationEnded>;

export const HallwayCallStarted = z.object({
  call: Call,
});
export type HallwayCallStarted = z.infer<typeof HallwayCallStarted>;

export const HallwayMessage = z.object({
  message: CallMessage,
});
export type HallwayMessage = z.infer<typeof HallwayMessage>;

export const HallwayCallEnded = z.object({
  callId: CallId,
  reason: CallEndReason,
});
export type HallwayCallEnded = z.infer<typeof HallwayCallEnded>;

export const HallwayErrorCode = z.enum([
  "SelfInviteNotAllowed",
  "InviterBusy",
  "InviteeUnavailable",
  "InvitationNotFound",
  "CallNotFound",
  "NotCallParticipant",
]);
export type HallwayErrorCode = z.infer<typeof HallwayErrorCode>;

export const HallwayCommandName = z.enum([
  "Invite",
  "Accept",
  "Decline",
  "Cancel",
  "Send",
  "Leave",
]);
export type HallwayCommandName = z.infer<typeof HallwayCommandName>;

export const HallwayCommandFailed = z.object({
  code: HallwayErrorCode,
  command: HallwayCommandName,
  message: z.string(),
});
export type HallwayCommandFailed = z.infer<typeof HallwayCommandFailed>;

export const HallwayServerMessages = {
  Welcome: HallwayWelcome,
  Snapshot: HallwaySnapshot,
  Invited: HallwayInvited,
  InvitationEnded: HallwayInvitationEnded,
  CallStarted: HallwayCallStarted,
  Message: HallwayMessage,
  CallEnded: HallwayCallEnded,
  CommandFailed: HallwayCommandFailed,
} as const;

export const HallwayInviteRequest = z.object({
  inviteeId: MemberId,
});
export type HallwayInviteRequest = z.infer<typeof HallwayInviteRequest>;

export const HallwayAcceptRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayAcceptRequest = z.infer<typeof HallwayAcceptRequest>;

export const HallwayDeclineRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayDeclineRequest = z.infer<typeof HallwayDeclineRequest>;

export const HallwayCancelRequest = z.object({
  invitationId: InvitationId,
});
export type HallwayCancelRequest = z.infer<typeof HallwayCancelRequest>;

export const HallwaySendMessageRequest = z.object({
  callId: CallId,
  text: z.string().min(1).max(500),
});
export type HallwaySendMessageRequest = z.infer<typeof HallwaySendMessageRequest>;

export const HallwayLeaveCallRequest = z.object({
  callId: CallId,
});
export type HallwayLeaveCallRequest = z.infer<typeof HallwayLeaveCallRequest>;

export const HallwayClientMessages = {
  Invite: HallwayInviteRequest,
  Accept: HallwayAcceptRequest,
  Decline: HallwayDeclineRequest,
  Cancel: HallwayCancelRequest,
  Send: HallwaySendMessageRequest,
  Leave: HallwayLeaveCallRequest,
} as const;

export const HallwayEnvelope = z.object({
  name: z.string().min(1),
  data: z.unknown(),
});
export type HallwayEnvelope = z.infer<typeof HallwayEnvelope>;
