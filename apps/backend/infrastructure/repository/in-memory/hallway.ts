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

/**
 * `HallwayRepository` の in-memory 実装
 * 招待と通話の両集約を、ID の主マップと複数の二次インデックスで保持する
 * 主マップは招待 / 通話本体、二次インデックスは発信者 / 受信者 / 参加者 / ルーム別の高速検索用で、全削除はルーム別インデックス経由で辿る
 * 不変条件として「メンバー 1 人が同時に持てる発信中招待は 1 件、着信中招待は 1 件、通話は 1 件」を仮定し、上書き保存は意図的に許容する
 */
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

  /**
   * 主マップと全二次インデックスから同じ招待を整合的に削除する
   * ルーム別インデックスは最後の要素が消えた時点で空 `Set` を取り除き、古いキーが残らないようにする
   */
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

  /**
   * 指定ルームに紐づく全招待と全通話を削除する、ルーム閉鎖時の一括クリーンアップで呼ばれる
   * 主マップと二次インデックスの両方から同時に落とし、残骸を残さないようにする
   */
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
