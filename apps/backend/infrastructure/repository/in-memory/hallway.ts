import { Injectable } from "@nestjs/common";
import type {
  Call,
  CallId,
  Invitation,
  InvitationId,
  MemberId,
  RoomId,
} from "@play.realtime/contracts";
import type { HallwayRepository } from "../../../domain/hallway";

@Injectable()
export class InMemoryHallwayRepository implements HallwayRepository {
  private readonly invitations = new Map<InvitationId, Invitation>();

  private readonly calls = new Map<CallId, Call>();

  private readonly outgoingByMember = new Map<MemberId, InvitationId>();

  private readonly incomingByMember = new Map<MemberId, InvitationId>();

  private readonly callByMember = new Map<MemberId, CallId>();

  private readonly invitationsByRoom = new Map<RoomId, Set<InvitationId>>();

  private readonly callsByRoom = new Map<RoomId, Set<CallId>>();

  async saveInvitation(invitation: Invitation): Promise<void> {
    this.invitations.set(invitation.id, invitation);
    this.outgoingByMember.set(invitation.fromMemberId, invitation.id);
    this.incomingByMember.set(invitation.toMemberId, invitation.id);
    const roomSet = this.invitationsByRoom.get(invitation.roomId) ?? new Set<InvitationId>();
    roomSet.add(invitation.id);
    this.invitationsByRoom.set(invitation.roomId, roomSet);
  }

  async findInvitation(id: InvitationId): Promise<Invitation | null> {
    return this.invitations.get(id) ?? null;
  }

  async findOutgoingInvitation(fromMemberId: MemberId): Promise<Invitation | null> {
    const id = this.outgoingByMember.get(fromMemberId);
    if (id === undefined) {
      return null;
    }
    return this.invitations.get(id) ?? null;
  }

  async findIncomingInvitation(toMemberId: MemberId): Promise<Invitation | null> {
    const id = this.incomingByMember.get(toMemberId);
    if (id === undefined) {
      return null;
    }
    return this.invitations.get(id) ?? null;
  }

  async findAllInvitationsInRoom(roomId: RoomId): Promise<Invitation[]> {
    const ids = this.invitationsByRoom.get(roomId);
    if (!ids) {
      return [];
    }
    const result: Invitation[] = [];
    for (const id of ids) {
      const invitation = this.invitations.get(id);
      if (invitation) {
        result.push(invitation);
      }
    }
    return result;
  }

  async deleteInvitation(id: InvitationId): Promise<void> {
    const invitation = this.invitations.get(id);
    if (!invitation) {
      return;
    }
    this.invitations.delete(id);
    this.outgoingByMember.delete(invitation.fromMemberId);
    this.incomingByMember.delete(invitation.toMemberId);
    const roomSet = this.invitationsByRoom.get(invitation.roomId);
    if (roomSet) {
      roomSet.delete(id);
      if (roomSet.size === 0) {
        this.invitationsByRoom.delete(invitation.roomId);
      }
    }
  }

  async saveCall(call: Call): Promise<void> {
    this.calls.set(call.id, call);
    for (const memberId of call.memberIds) {
      this.callByMember.set(memberId, call.id);
    }
    const roomSet = this.callsByRoom.get(call.roomId) ?? new Set<CallId>();
    roomSet.add(call.id);
    this.callsByRoom.set(call.roomId, roomSet);
  }

  async findCall(id: CallId): Promise<Call | null> {
    return this.calls.get(id) ?? null;
  }

  async findCallForMember(memberId: MemberId): Promise<Call | null> {
    const id = this.callByMember.get(memberId);
    if (id === undefined) {
      return null;
    }
    return this.calls.get(id) ?? null;
  }

  async findAllCallsInRoom(roomId: RoomId): Promise<Call[]> {
    const ids = this.callsByRoom.get(roomId);
    if (!ids) {
      return [];
    }
    const result: Call[] = [];
    for (const id of ids) {
      const call = this.calls.get(id);
      if (call) {
        result.push(call);
      }
    }
    return result;
  }

  async deleteCall(id: CallId): Promise<void> {
    const call = this.calls.get(id);
    if (!call) {
      return;
    }
    this.calls.delete(id);
    for (const memberId of call.memberIds) {
      this.callByMember.delete(memberId);
    }
    const roomSet = this.callsByRoom.get(call.roomId);
    if (roomSet) {
      roomSet.delete(id);
      if (roomSet.size === 0) {
        this.callsByRoom.delete(call.roomId);
      }
    }
  }

  async remove(roomId: RoomId): Promise<void> {
    const invitationIds = this.invitationsByRoom.get(roomId);
    if (invitationIds) {
      for (const id of invitationIds) {
        const invitation = this.invitations.get(id);
        if (invitation) {
          this.invitations.delete(id);
          this.outgoingByMember.delete(invitation.fromMemberId);
          this.incomingByMember.delete(invitation.toMemberId);
        }
      }
      this.invitationsByRoom.delete(roomId);
    }
    const callIds = this.callsByRoom.get(roomId);
    if (callIds) {
      for (const id of callIds) {
        const call = this.calls.get(id);
        if (call) {
          this.calls.delete(id);
          for (const memberId of call.memberIds) {
            this.callByMember.delete(memberId);
          }
        }
      }
      this.callsByRoom.delete(roomId);
    }
  }
}
