import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";

export type HallwayRepository = {
  saveInvitation: (invitation: Invitation) => Promise<void>;

  findInvitation: (id: InvitationId) => Promise<Invitation | null>;

  findOutgoingInvitation: (fromMemberId: MemberId) => Promise<Invitation | null>;

  findIncomingInvitation: (toMemberId: MemberId) => Promise<Invitation | null>;

  findAllInvitationsInRoom: (roomId: RoomId) => Promise<Invitation[]>;

  deleteInvitation: (id: InvitationId) => Promise<void>;

  saveCall: (call: Call) => Promise<void>;

  findCall: (id: CallId) => Promise<Call | null>;

  findCallForMember: (memberId: MemberId) => Promise<Call | null>;

  findAllCallsInRoom: (roomId: RoomId) => Promise<Call[]>;

  deleteCall: (id: CallId) => Promise<void>;

  remove: (roomId: RoomId) => Promise<void>;
};

export const HallwayRepository = "HallwayRepository" as const;
