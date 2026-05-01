import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import {
  Call,
  type CallId,
  Invitation,
  type InvitationId,
  type MemberId,
  type RoomId,
} from "@play.realtime/contracts";
import { Redis, type RedisOptions } from "ioredis";
import type { HallwayRepository } from "../../../domain/hallway";

/**
 * `HallwayRepository` の Redis 実装
 * 招待と通話の本体は `hallway:invitation:{id}` と `hallway:call:{id}` の String キーに JSON で保持する
 * 二次インデックスは「ルーム別 Set」「メンバー別 String」の組み合わせで構成し、in-memory 実装の 7 種類の Map と同じ参照軸を再現する
 * 招待や通話の保存と削除は複数キーを同時更新する必要があるため `MULTI/EXEC` で atomic 化し、不整合が観測されないようにする
 */
@Injectable()
export class RedisHallwayRepository implements HallwayRepository, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisHallwayRepository.name);

  constructor(redisUrl: string, options: RedisOptions = {}) {
    this.client = new Redis(redisUrl, options);
  }

  async saveInvitation(invitation: Invitation): Promise<void> {
    await this.client
      .multi()
      .set(this.invitationKey(invitation.id), JSON.stringify(invitation))
      .set(this.outgoingByMemberKey(invitation.fromMemberId), invitation.id)
      .set(this.incomingByMemberKey(invitation.toMemberId), invitation.id)
      .sadd(this.invitationsByRoomKey(invitation.roomId), invitation.id)
      .exec();
  }

  async findInvitation(id: InvitationId): Promise<Invitation | null> {
    const raw = await this.client.get(this.invitationKey(id));
    if (raw === null) {
      return null;
    }
    return Invitation.parse(JSON.parse(raw));
  }

  async findOutgoingInvitation(fromMemberId: MemberId): Promise<Invitation | null> {
    const id = await this.client.get(this.outgoingByMemberKey(fromMemberId));
    if (id === null) {
      return null;
    }
    return this.findInvitation(id as InvitationId);
  }

  async findIncomingInvitation(toMemberId: MemberId): Promise<Invitation | null> {
    const id = await this.client.get(this.incomingByMemberKey(toMemberId));
    if (id === null) {
      return null;
    }
    return this.findInvitation(id as InvitationId);
  }

  async findAllInvitationsInRoom(roomId: RoomId): Promise<Invitation[]> {
    const ids = await this.client.smembers(this.invitationsByRoomKey(roomId));
    if (ids.length === 0) {
      return [];
    }

    const raws = await this.client.mget(...ids.map((id) => this.invitationKey(id as InvitationId)));
    return raws
      .filter((raw): raw is string => raw !== null)
      .map((raw) => Invitation.parse(JSON.parse(raw)));
  }

  async deleteInvitation(id: InvitationId): Promise<void> {
    const invitation = await this.findInvitation(id);
    if (!invitation) {
      return;
    }
    await this.client
      .multi()
      .del(this.invitationKey(id))
      .del(this.outgoingByMemberKey(invitation.fromMemberId))
      .del(this.incomingByMemberKey(invitation.toMemberId))
      .srem(this.invitationsByRoomKey(invitation.roomId), id)
      .exec();
  }

  async saveCall(call: Call): Promise<void> {
    const tx = this.client.multi();
    tx.set(this.callKey(call.id), JSON.stringify(call));
    for (const memberId of call.memberIds) {
      tx.set(this.callByMemberKey(memberId), call.id);
    }
    tx.sadd(this.callsByRoomKey(call.roomId), call.id);
    await tx.exec();
  }

  async findCall(id: CallId): Promise<Call | null> {
    const raw = await this.client.get(this.callKey(id));
    if (raw === null) {
      return null;
    }
    return Call.parse(JSON.parse(raw));
  }

  async findCallForMember(memberId: MemberId): Promise<Call | null> {
    const id = await this.client.get(this.callByMemberKey(memberId));
    if (id === null) {
      return null;
    }
    return this.findCall(id as CallId);
  }

  async findAllCallsInRoom(roomId: RoomId): Promise<Call[]> {
    const ids = await this.client.smembers(this.callsByRoomKey(roomId));
    if (ids.length === 0) {
      return [];
    }

    const raws = await this.client.mget(...ids.map((id) => this.callKey(id as CallId)));
    return raws
      .filter((raw): raw is string => raw !== null)
      .map((raw) => Call.parse(JSON.parse(raw)));
  }

  async deleteCall(id: CallId): Promise<void> {
    const call = await this.findCall(id);
    if (!call) {
      return;
    }

    const tx = this.client.multi();
    tx.del(this.callKey(id));
    for (const memberId of call.memberIds) {
      tx.del(this.callByMemberKey(memberId));
    }
    tx.srem(this.callsByRoomKey(call.roomId), id);
    await tx.exec();
  }

  async remove(roomId: RoomId): Promise<void> {
    const invitations = await this.findAllInvitationsInRoom(roomId);
    const calls = await this.findAllCallsInRoom(roomId);
    const tx = this.client.multi();
    for (const invitation of invitations) {
      tx.del(this.invitationKey(invitation.id));
      tx.del(this.outgoingByMemberKey(invitation.fromMemberId));
      tx.del(this.incomingByMemberKey(invitation.toMemberId));
    }
    tx.del(this.invitationsByRoomKey(roomId));
    for (const call of calls) {
      tx.del(this.callKey(call.id));
      for (const memberId of call.memberIds) {
        tx.del(this.callByMemberKey(memberId));
      }
    }
    tx.del(this.callsByRoomKey(roomId));
    await tx.exec();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.error("redis QUIT failed", error instanceof Error ? error.stack : String(error));
    }
  }

  private invitationKey(id: InvitationId): string {
    return `hallway:invitation:${id}`;
  }

  private callKey(id: CallId): string {
    return `hallway:call:${id}`;
  }

  private invitationsByRoomKey(roomId: RoomId): string {
    return `hallway:room:${roomId}:invitations`;
  }

  private callsByRoomKey(roomId: RoomId): string {
    return `hallway:room:${roomId}:calls`;
  }

  private outgoingByMemberKey(memberId: MemberId): string {
    return `hallway:member:${memberId}:outgoing-invitation`;
  }

  private incomingByMemberKey(memberId: MemberId): string {
    return `hallway:member:${memberId}:incoming-invitation`;
  }

  private callByMemberKey(memberId: MemberId): string {
    return `hallway:member:${memberId}:call`;
  }
}
