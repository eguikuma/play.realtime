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
 * 招待と通話の仮置き実装
 * 主 ID 別のマップに加え メンバー起点とルーム起点の逆引き索引を保持することで 検索計算量を定数に抑える
 */
@Injectable()
export class InMemoryHallwayRepository implements HallwayRepository {
  /**
   * 招待 ID を鍵として 招待の本体を持つ台帳
   */
  private readonly invitations = new Map<InvitationId, Invitation>();
  /**
   * 通話 ID を鍵として 通話の本体を持つ台帳
   */
  private readonly calls = new Map<CallId, Call>();
  /**
   * 発信側メンバーから 未応答の招待 ID への逆引き索引
   */
  private readonly outgoingByMember = new Map<MemberId, InvitationId>();
  /**
   * 受信側メンバーから 未応答の招待 ID への逆引き索引
   */
  private readonly incomingByMember = new Map<MemberId, InvitationId>();
  /**
   * メンバーから 参加中の通話 ID への逆引き索引
   */
  private readonly callByMember = new Map<MemberId, CallId>();
  /**
   * ルーム単位で抱える招待 ID の集合
   */
  private readonly invitationsByRoom = new Map<RoomId, Set<InvitationId>>();
  /**
   * ルーム単位で抱える通話 ID の集合
   */
  private readonly callsByRoom = new Map<RoomId, Set<CallId>>();

  /**
   * 招待を保存し 全ての逆引き索引を整合させる
   */
  async saveInvitation(invitation: Invitation): Promise<void> {
    this.invitations.set(invitation.id, invitation);
    this.outgoingByMember.set(invitation.fromMemberId, invitation.id);
    this.incomingByMember.set(invitation.toMemberId, invitation.id);
    const roomSet = this.invitationsByRoom.get(invitation.roomId) ?? new Set<InvitationId>();
    roomSet.add(invitation.id);
    this.invitationsByRoom.set(invitation.roomId, roomSet);
  }

  /**
   * 招待を ID 直接引きで返す
   */
  async findInvitation(id: InvitationId): Promise<Invitation | null> {
    return this.invitations.get(id) ?? null;
  }

  /**
   * 指定メンバーが出している未応答の招待を返す
   */
  async findOutgoingInvitation(fromMemberId: MemberId): Promise<Invitation | null> {
    const id = this.outgoingByMember.get(fromMemberId);
    if (id === undefined) {
      return null;
    }
    return this.invitations.get(id) ?? null;
  }

  /**
   * 指定メンバー宛の未応答の招待を返す
   */
  async findIncomingInvitation(toMemberId: MemberId): Promise<Invitation | null> {
    const id = this.incomingByMember.get(toMemberId);
    if (id === undefined) {
      return null;
    }
    return this.invitations.get(id) ?? null;
  }

  /**
   * ルーム内の全招待を返す
   * 索引に残っているが実体が欠落しているものは静かに読み飛ばす
   */
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
   * 招待を削除し 関係する逆引き索引も後片付けする
   * すでに消えている場合は冪等に無視する
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

  /**
   * 通話を保存し 参加メンバーとルーム単位の逆引き索引も埋める
   */
  async saveCall(call: Call): Promise<void> {
    this.calls.set(call.id, call);
    for (const memberId of call.memberIds) {
      this.callByMember.set(memberId, call.id);
    }
    const roomSet = this.callsByRoom.get(call.roomId) ?? new Set<CallId>();
    roomSet.add(call.id);
    this.callsByRoom.set(call.roomId, roomSet);
  }

  /**
   * 通話を ID 直接引きで返す
   */
  async findCall(id: CallId): Promise<Call | null> {
    return this.calls.get(id) ?? null;
  }

  /**
   * 指定メンバーが参加中の通話を返す
   */
  async findCallForMember(memberId: MemberId): Promise<Call | null> {
    const id = this.callByMember.get(memberId);
    if (id === undefined) {
      return null;
    }
    return this.calls.get(id) ?? null;
  }

  /**
   * ルーム内の全通話を返す
   * 索引に残っているが実体が欠落しているものは静かに読み飛ばす
   */
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

  /**
   * 通話を削除し 関係する逆引き索引も後片付けする
   * すでに消えている場合は冪等に無視する
   */
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
   * 指定ルームに紐づく招待と通話を本体と逆引き索引もまとめて破棄する
   * ルーム生命サイクル終了時に呼ぶ一括破棄で 個別 ID 削除とは別軸で動く
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
